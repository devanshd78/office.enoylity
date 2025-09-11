"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { ChevronsUpDown, Check, X } from "lucide-react";
import Swal from "sweetalert2";
import { post, postBlob } from "../utils/apiClient";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface KpiItem {
  kpiId: string;
  employeeId: string;
  employeeName: string;
  projectName: string;
  startdate: string | null;
  deadline: string | null;
  remark: string;
  points: number; // Deadline Points
  qualityPoints?: number | null; // -1 or +1 (display only unless canManageKpi)
  lastPunchDate?: string;
  lastPunchRemark?: string;
  lastPunchStatus?: string | null;
}

interface Employee {
  employeeId: string;
  employeeName: string;
}

const COLUMNS: Array<keyof KpiItem> = [
  "employeeName",
  "projectName",
  "startdate",
  "deadline",
  "remark",
  "points", // labeled as "Deadline Points"
];

interface MultiSelectOption {
  label: string;
  value: string;
}
interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

// === Date formatting helpers ===
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

const formatShortDate = (value?: string | null): string => {
  if (!value) return "";
  // Try a few common formats safely
  const tryParse = (s: string): Date | null => {
    const dt1 = new Date(s);
    if (!Number.isNaN(dt1.getTime())) return dt1;

    // Fallbacks: normalize to YYYY-MM-DD where possible
    const base = s.slice(0, 10).replace(/[./]/g, "-");
    const parts = base.split("-");
    if (parts.length === 3) {
      let d: Date | null = null;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const [y, m, dd] = parts.map((p) => parseInt(p, 10));
        d = new Date(y, (m || 1) - 1, dd || 1);
      } else {
        // DD-MM-YYYY (or similar)
        const [dd, m, y] = parts.map((p) => parseInt(p, 10));
        d = new Date(y || 0, (m || 1) - 1, dd || 1);
      }
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  };

  const dt = tryParse(value);
  if (!dt) return value; // if unparsable, return original
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = MONTHS[dt.getMonth()];
  return `${day} ${mon}`; // e.g., 09 Sept
};

const MultiSelect: FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = "Select options",
  className,
  buttonClassName,
}) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.filter((o) => values.includes(o.value)),
    [options, values]
  );

  const toggleValue = (val: string) => {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };

  const allSelected = selected.length === options.length && options.length > 0;

  const labelPreview = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length <= 2) return selected.map((s) => s.label).join(", ");
    return `${selected[0].label}, ${selected[1].label} +${selected.length - 2} more`;
  }, [selected, placeholder]);

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-[260px] justify-between ${buttonClassName ?? ""}`}
          >
            <span className="truncate text-left">{labelPreview}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command className="max-h-72">
            <CommandInput placeholder="Search employees..." />
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Make the LIST scroll, not a nested ScrollArea */}
            <CommandList className="max-h-72 overflow-y-auto">
              <CommandGroup heading="Bulk">
                <CommandItem
                  value={selected.length === options.length && options.length > 0 ? "deselect-all" : "select-all"}
                  onSelect={() =>
                    onChange(selected.length === options.length && options.length > 0 ? [] : options.map((o) => o.value))
                  }
                  className="cursor-pointer"
                >
                  <Checkbox className="mr-2" checked={selected.length === options.length && options.length > 0} />
                  {selected.length === options.length && options.length > 0 ? "Deselect all" : "Select all"}
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Employees">
                {options.map((opt) => {
                  const checked = values.includes(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => toggleValue(opt.value)}
                      className="cursor-pointer"
                    >
                      <Checkbox checked={checked} className="mr-2" />
                      <span className="flex-1 truncate">{opt.label}</span>
                      {checked ? <Check className="h-4 w-4" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>

      </Popover>
    </div>
  );
};

type ExportScope = "all" | "selected" | "mine";

const KpisPage: FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<keyof KpiItem>("startdate");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(10);

  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, number>>({});
  useEffect(() => {
    setRole(localStorage.getItem("role"));
    try {
      setPermissions(JSON.parse(localStorage.getItem("permissions") || "{}"));
    } catch {
      setPermissions({});
    }
  }, []);

  const canView = useMemo(
    () =>
      role === "admin" ||
      role === "subadmin" ||
      permissions["View KPI details"] === 1,
    [role, permissions]
  );
  const canAdd = useMemo(
    () =>
      role === "admin" ||
      role === "subadmin" ||
      permissions["Add KPI details"] === 1,
    [role, permissions]
  );
  const canDelete = useMemo(
    () => role === "admin" || permissions["Delete KPI"] === 1,
    [role, permissions]
  );

  const canManageKpi = useMemo(
    () => role === "admin" || (role === "subadmin" && permissions["Manage KPI"] === 1),
    [role, permissions]
  );

  const [data, setData] = useState<KpiItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // ===== CSV Export (modal) state =====
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setExportScope(canManageKpi ? "all" : "mine");
  }, [canManageKpi]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await post<{
        success: boolean;
        data: { employees: any[] };
      }>("/employee/getlist", { page: 1, pageSize: 1000 });

      if (res?.success && Array.isArray(res.data?.employees)) {
        // 1) Normalize shape + choose a stable id
        const normalized: Employee[] = res.data.employees
          .map((raw, idx): Employee | null => {
            const id =
              raw.employeeId ??
              raw.employee_id ??
              raw.id ??
              raw._id ??
              raw.employeeCode ??
              raw.code ??
              raw.email ?? // last-resort fallback
              null;

            if (!id) return null; // can't use this row without an id

            const name =
              raw.name ||
              String(id);

            return {
              employeeId: String(id),
              employeeName: String(name),
            };
          })
          .filter((e): e is Employee => !!e);

        // 2) Dedupe by the resolved id (not by possibly-undefined employeeId)
        const seen = new Set<string>();
        const unique: Employee[] = [];
        for (const e of normalized) {
          const key = e.employeeId.trim();
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(e);
        }

        // 3) Sort for display
        unique.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

        setEmployees(unique);
      }
    } catch (e) {
      console.warn("Failed to fetch employees list", e);
    }
  }, []);

  useEffect(() => {
    if (canManageKpi) fetchEmployees();
  }, [canManageKpi, fetchEmployees]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiSortField =
        sortField === "startdate" || sortField === "deadline"
          ? sortField
          : "createdAt";
      const sortOrder = sortAsc ? "asc" : "desc";

      const payload: any = {
        search,
        page,
        pageSize: perPage,
        sortBy: apiSortField,
        sortOrder,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      if (canManageKpi && selectedEmployeeIds.length > 0) {
        payload.employeeIds = selectedEmployeeIds;
      }

      if (!canManageKpi) {
        const employeeId = localStorage.getItem("employeeId");
        if (employeeId) payload.employeeId = employeeId;

        const res = await post<{ success: boolean; data: { kpis: any[] } }>(
          "/kpi/getByEmployeeId",
          payload
        );

        if (res.success) {
          const mapped: KpiItem[] = res.data.kpis.map((r) => {
            const last = r.punches?.length ? r.punches[r.punches.length - 1] : null;
            return {
              kpiId: r.kpiId,
              employeeId: r.employeeId,
              employeeName: r.employeeName,
              projectName: r.projectName,
              startdate: r.startdate || null,
              deadline: r.deadline || null,
              remark: r.Remark || "",
              points: r.points,
              qualityPoints: r.qualityPoints ?? r.quality ?? r.quality_points ?? null,
              lastPunchDate: last?.punchDate,
              lastPunchRemark: last?.remark,
              lastPunchStatus: last?.status ?? null,
            } as KpiItem;
          });

          setData(mapped);
          setTotalPages(1);
          setPage(1);
        } else {
          Swal.fire("Error", "Failed to fetch your KPIs", "error");
        }
      } else {
        const res = await post<{
          success: boolean;
          data: { kpis: any[]; page: number; pageSize: number; total: number };
        }>("/kpi/getAll", payload);

        if (res.success) {
          const mapped: KpiItem[] = res.data.kpis.map((r) => {
            const last = r.punches?.length ? r.punches[r.punches.length - 1] : null;
            return {
              kpiId: r.kpiId,
              employeeId: r.employeeId,
              employeeName: r.employeeName,
              projectName: r.projectName,
              startdate: r.startdate || null,
              deadline: r.deadline || null,
              remark: r.Remark || r.remark || "",
              points: r.points,
              qualityPoints: r.qualityPoints ?? r.quality ?? r.quality_points ?? null,
              lastPunchDate: last?.punchDate,
              lastPunchRemark: last?.remark,
              lastPunchStatus: last?.status ?? null,
            } as KpiItem;
          });

          setData(mapped);
          const serverTotal = res.data.total ?? mapped.length;
          setTotalPages(Math.max(1, Math.ceil(serverTotal / perPage)));
        } else {
          Swal.fire("Error", "Failed to fetch KPIs", "error");
        }
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to fetch KPIs", "error");
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate, page, sortField, sortAsc, role, selectedEmployeeIds, canManageKpi, perPage]);

  useEffect(() => {
    if (canView) fetchData();
  }, [canView, fetchData]);

  const onSort = (field: keyof KpiItem) => {
    if (field === sortField) setSortAsc((p) => !p);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAdd = () => router.push("/kpi/addupdate");
  const handleEdit = (id: string) => router.push(`/kpi/addupdate?kpiId=${id}`);

  const handlePunch = async (kpiId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "Punch In",
      input: "textarea",
      inputLabel: "Remark (optional)",
      inputPlaceholder: "You can leave this blank",
      showCancelButton: true,
    });

    // Only stop if the user cancels the dialog
    if (!isConfirmed) return;

    try {
      setLoading(true);

      // Always send remark as empty string
      const payload = { kpiId, remark: "" as const };

      const res = await post<{ success: boolean; data?: any; message?: string }>(
        "/kpi/punch",
        payload
      );

      if (res?.success) {
        const d = res.data || {};
        await Swal.fire({
          title: "Success",
          html: `
          <p>${res?.message || "Punch recorded successfully"}</p>
          ${d.punchDate ? `<p><strong>Date:</strong> ${formatShortDate(d.punchDate)}</p>` : ""}
          ${d.status ? `<p><strong>Status:</strong> ${d.status}</p>` : ""}
        `,
          icon: "success",
        });
        fetchData();
      } else {
        await Swal.fire("Error", res?.message || "Punch failed", "error");
      }
    } catch (e: any) {
      let msg = e?.message || "Punch request failed";
      const apiMsg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : "");
      if (apiMsg) msg = apiMsg;
      await Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPunch = (date: string, remark: string, status: string | null) => {
    Swal.fire({
      title: "Last Punch Details",
      html: `
        <p><strong>Date:</strong> ${formatShortDate(date)}</p>
        <p><strong>Remark:</strong> ${remark}</p>
        <p><strong>Status:</strong> ${status}</p>
      `,
      icon: "info",
    });
  };

  const handleDelete = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete KPI?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!isConfirmed) return;
    try {
      const res = await post<{ success: boolean }>("/kpi/deleteKpi", { kpiId: id });
      if (res.success) fetchData();
      else Swal.fire("Error", "Delete failed", "error");
    } catch {
      Swal.fire("Error", "Delete request failed", "error");
    }
  };

  // Move quality controls into ACTIONS; only when canManageKpi
  const handleQuality = async (kpiId: string, value: -1 | 1) => {
    try {
      setLoading(true);
      const res = await post<{ success: boolean; data?: any; message?: string }>(
        "/kpi/setQualityPoint",
        { kpiId, qualityPoints: value }
      );
      if (res.success) {
        Swal.fire("Updated", "Quality points updated", "success");
        fetchData();
      } else {
        Swal.fire("Error", res?.message || "Failed to update quality points", "error");
      }
    } catch {
      Swal.fire("Error", "Quality update request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Export CSV logic (manager-only, send only employeeId) =====
  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);

      if (!canManageKpi) {
        Swal.fire("Permission denied", "Only managers can export CSV.", "error");
        return;
      }

      // Resolve employeeIds
      let ids: string[] = [];
      if (exportScope === "selected") {
        if (!selectedEmployeeIds.length) {
          Swal.fire("Select employees", "Please choose at least one employee.", "info");
          return;
        }
        ids = selectedEmployeeIds;
      } else {
        if (!employees.length) {
          Swal.fire("No employees", "Employees list is empty; cannot export.", "error");
          return;
        }
        ids = employees.map((e) => e.employeeId);
      }

      // Build payload with filters
      const payload: any = {
        employeeId: ids.length === 1 ? ids[0] : ids,
        all: true, // export all rows (ignore pagination window)
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: (sortField === "startdate" || sortField === "deadline") ? sortField : "createdAt",
        sortOrder: sortAsc ? "asc" : "desc",
      };

      // Call backend for CSV blob
      const blob = await postBlob("/kpi/exportCsv", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: (s) => s >= 200 && s < 300,
      });

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `kpis-${exportScope}-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportOpen(false);
      Swal.fire("Exported", "Your CSV download has started.", "success");
    } catch (e: any) {
      let message = e?.message || "Failed to export CSV";
      const maybeBlob = e?.response?.data;
      if (maybeBlob instanceof Blob) {
        try {
          const text = await maybeBlob.text();
          message = text || message;
        } catch { }
      }
      console.error(e);
      Swal.fire("Error", message, "error");
    } finally {
      setExporting(false);
    }
  }, [canManageKpi, exportScope, selectedEmployeeIds, employees, search, startDate, endDate, sortField, sortAsc]);


  const employeeOptions: MultiSelectOption[] = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.employeeId,
        label: `${emp.employeeName} (${emp.employeeId})`,
      })),
    [employees]
  );

  const selectedEmployees = useMemo<Employee[]>(() => {
    if (!selectedEmployeeIds.length) return [];
    const index = new Map(employees.map((e) => [e.employeeId, e] as const));
    return selectedEmployeeIds
      .map((id) => index.get(id))
      .filter((e): e is Employee => Boolean(e));
  }, [employees, selectedEmployeeIds]);

  const getSerial = (index: number) => (page - 1) * perPage + index + 1;

  const renderQualityValue = (qp?: number | null) =>
    qp === -1 ? -1 : qp === 1 ? +1 : "";

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-8xl mx-auto bg-white rounded shadow p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search by Employee, Project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
          />

          {canManageKpi && (
            <div className="flex items-start gap-2">
              <MultiSelect
                options={employeeOptions}
                values={selectedEmployeeIds}
                onChange={(vals) => {
                  setSelectedEmployeeIds(vals);
                  setPage(1);
                }}
                placeholder="Select employees"
              />
            </div>
          )}

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded"
          />

          {canAdd && (
            <button
              onClick={handleAdd}
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" /> Add KPI
            </button>
          )}

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 border rounded"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          {/* Export CSV button (manager-only) */}
          {canManageKpi && (
            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="whitespace-nowrap"
            >
              Export CSV
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canView ? (
          <div className="text-center py-4">No view permissions.</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4">No KPIs.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Sr. No.</th>

                    {COLUMNS.map((col) => {
                      const label =
                        col === "points"
                          ? "Deadline Points"
                          : col.charAt(0).toUpperCase() + col.slice(1);
                      return (
                        <th
                          key={col}
                          onClick={() => onSort(col)}
                          className="px-3 py-2 text-left cursor-pointer whitespace-nowrap"
                        >
                          <div className="flex items-center">
                            {label}
                            {sortField === col ? (
                              sortAsc ? (
                                <FaSortUp className="ml-1" />
                              ) : (
                                <FaSortDown className="ml-1" />
                              )
                            ) : (
                              <FaSort className="ml-1 text-gray-400" />
                            )}
                          </div>
                        </th>
                      );
                    })}

                    {/* Separate Quality Points column (display-only) */}
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Quality Points
                    </th>

                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((k, index) => (
                    <tr key={k.kpiId} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {getSerial(index)}
                      </td>

                      {COLUMNS.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-sm">
                          {col === "startdate" || col === "deadline"
                            ? formatShortDate(k[col] as string | null)
                            : ((k as any)[col] as any)}
                        </td>
                      ))}

                      {/* Quality value only */}
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {renderQualityValue(k.qualityPoints)}
                      </td>

                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 flex-nowrap min-w-[520px]">
                          <button
                            onClick={() => handleEdit(k.kpiId)}
                            className="h-8 px-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(k.kpiId)}
                              className="h-8 px-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}

                          {!k.lastPunchDate ? (
                            <button
                              onClick={() => handlePunch(k.kpiId)}
                              className="h-8 px-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                              title="Punch In"
                            >
                              PunchIn
                            </button>
                          ) : (
                            <>
                              <button
                                disabled
                                className="h-8 px-2 text-xs bg-gray-400 text-white rounded whitespace-nowrap"
                                title="Already Punched"
                              >
                                Punched
                              </button>
                              <button
                                onClick={() =>
                                  handleViewPunch(k.lastPunchDate!, k.lastPunchRemark!, k.lastPunchStatus!)
                                }
                                className="h-8 px-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                                title="View Punch"
                              >
                                ViewPunch
                              </button>
                            </>
                          )}

                          {canManageKpi && (
                            <div className="flex items-center gap-2 flex-nowrap">
                              <button
                                onClick={() => handleQuality(k.kpiId, -1)}
                                className="h-8 px-2 text-xs border rounded hover:bg-gray-100 whitespace-nowrap"
                                title="Set Quality -1"
                              >
                                QP -1
                              </button>
                              <button
                                onClick={() => handleQuality(k.kpiId, 1)}
                                className="h-8 px-2 text-xs border rounded hover:bg-gray-100 whitespace-nowrap"
                                title="Set Quality +1"
                              >
                                QP +1
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden">
              {data.map((k, index) => (
                <div key={k.kpiId} className="bg-white mb-4 rounded shadow">
                  <div className="flex justify-between p-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Sr. No.: {getSerial(index)}
                      </div>
                      <div className="font-semibold">{k.projectName}</div>
                      <div className="text-sm text-gray-600">{k.employeeName}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(k.kpiId)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FaEdit />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(k.kpiId)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                      {/* Expand */}
                      <button onClick={() => toggleExpand(k.kpiId)}>
                        {expanded[k.kpiId] ? <FaSortUp /> : <FaSortDown />}
                      </button>
                    </div>
                  </div>
                  {expanded[k.kpiId] && (
                    <div className="p-4 space-y-2 text-sm">
                      <div>
                        <strong>Start:</strong> {formatShortDate(k.startdate)}
                      </div>
                      <div>
                        <strong>Deadline:</strong> {formatShortDate(k.deadline)}
                      </div>
                      <div>
                        <strong>Remark:</strong> {k.remark}
                      </div>
                      <div>
                        <strong>Deadline Points:</strong> {k.points}
                      </div>
                      <div>
                        <strong>Quality Points:</strong>{" "}
                        {renderQualityValue(k.qualityPoints)}
                      </div>

                      {/* Quality controls appear in the ACTIONS area (top buttons) only for managers */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {!k.lastPunchDate ? (
                          <button
                            onClick={() => handlePunch(k.kpiId)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            PunchIn
                          </button>
                        ) : (
                          <>
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-400 text-white rounded"
                            >
                              PunchIn
                            </button>
                            <button
                              onClick={() =>
                                handleViewPunch(
                                  k.lastPunchDate!,
                                  k.lastPunchRemark!,
                                  k.lastPunchStatus!
                                )
                              }
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              ViewPunch
                            </button>
                          </>
                        )}

                        {canManageKpi && (
                          <>
                            <button
                              onClick={() => handleQuality(k.kpiId, -1)}
                              className="px-3 py-2 border rounded hover:bg-gray-100"
                            >
                              QP -1
                            </button>
                            <button
                              onClick={() => handleQuality(k.kpiId, 1)}
                              className="px-3 py-2 border rounded hover:bg-gray-100"
                            >
                              QP +1
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-indigo-200" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KpisPage;

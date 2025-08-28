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
import { ChevronsUpDown, Check } from "lucide-react";
import Swal from "sweetalert2";
import { post } from "../utils/apiClient";

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
          <Command>
            <CommandInput placeholder="Search employees..." />
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList>
              <CommandGroup heading="Bulk">
                <CommandItem
                  value={allSelected ? "deselect-all" : "select-all"}
                  onSelect={() =>
                    onChange(allSelected ? [] : options.map((o) => o.value))
                  }
                  className="cursor-pointer"
                >
                  <Checkbox className="mr-2" checked={allSelected} />
                  {allSelected ? "Deselect all" : "Select all"}
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Employees">
                <ScrollArea className="max-h-64">
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
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const KpisPage: FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<keyof KpiItem>("startdate");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
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

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await post<{
        success: boolean;
        data: { employees: Array<{ employeeId: string; name: string }> };
      }>("/employee/getlist", { page: 1, pageSize: 1000 });

      if (res?.success && Array.isArray(res.data?.employees)) {
        const dedup = new Map<string, Employee>();
        res.data.employees.forEach((e) => {
          dedup.set(e.employeeId, {
            employeeId: e.employeeId,
            employeeName: e.name,
          });
        });
        setEmployees(
          Array.from(dedup.values()).sort((a, b) =>
            a.employeeName.localeCompare(b.employeeName)
          )
        );
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
  }, [search, startDate, endDate, page, sortField, sortAsc, role, selectedEmployeeIds, canManageKpi]);

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
    const { value: remark } = await Swal.fire({
      title: "Punch In",
      input: "textarea",
      inputLabel: "Remark",
      inputPlaceholder: "Enter your remark...",
      showCancelButton: true,
    });
    if (!remark) return;
    try {
      setLoading(true);
      const res = await post<{ success: boolean; data: any }>("/kpi/punch", {
        kpiId,
        remark,
      });
      if (res.success) {
        Swal.fire("Success", "Punch recorded successfully", "success");
        fetchData();
      } else {
        Swal.fire("Error", "Punch failed", "error");
      }
    } catch {
      Swal.fire("Error", "Punch request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPunch = (date: string, remark: string, status: string | null) => {
    Swal.fire({
      title: "Last Punch Details",
      html: `
        <p><strong>Date:</strong> ${date}</p>
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

  const employeeOptions: MultiSelectOption[] = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.employeeId,
        label: `${emp.employeeName} (${emp.employeeId})`,
      })),
    [employees]
  );

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
                          {k[col] as any}
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
                                PunchIn
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
                        <strong>Start:</strong> {k.startdate}
                      </div>
                      <div>
                        <strong>Deadline:</strong> {k.deadline}
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
                  className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-indigo-200" : ""
                    }`}
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

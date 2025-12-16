"use client";

import React, { FC, useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { get, post } from "@/app/utils/apiClient";

interface Employee {
  employeeId: string;
  name: string;
}

interface KpiInput {
  employeeId: string;
  projectName: string;
  startdate: string;
  deadline: string;
  remark: string;
}

// Helper: safe JSON parse
const safeParseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const AddUpdateKpiPage: FC = () => {
  const router = useRouter();
  const params = useSearchParams();

  const kpiId = params.get("kpiId") ?? "";
  const isEdit = Boolean(kpiId);

  // Permissions / user
  const [userRole, setUserRole] = useState("");
  const [canManageKpi, setCanManageKpi] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);

  // KPI form
  const [input, setInput] = useState<KpiInput>({
    employeeId: "",
    projectName: "",
    startdate: "",
    deadline: "",
    remark: "",
  });

  // Loading + submission lock (prevents 2-3-4-5 clicks + multiple API calls)
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Determine permission and load employees/user on mount
  useEffect(() => {
    let alive = true;

    const role = localStorage.getItem("role") || "";
    const empIdLS = localStorage.getItem("employeeId") || "";
    const permsObj = safeParseJson<Record<string, any>>(
      localStorage.getItem("permissions"),
      {}
    );

    const canManageFlag = role === "admin" || (role === "subadmin" && permsObj["Manage KPI"] === 1);

    setUserRole(role);
    setCanManageKpi(canManageFlag);

    const load = async () => {
      try {
        if (canManageFlag) {
          const res = await post<{
            success: boolean;
            data: { employees: Employee[] };
            message?: string;
          }>("/employee/getlist", { page: 1, pageSize: 1000 });

          if (!alive) return;

          if (res.success) {
            setEmployees(res.data?.employees || []);
          } else {
            throw new Error(res.message || "Failed to load employees");
          }
        } else {
          const res = await get<{
            success: boolean;
            data: { employee: Employee };
            message?: string;
          }>(`/employee/getrecord?employeeId=${encodeURIComponent(empIdLS)}`);

          if (!alive) return;

          if (res.success) {
            const emp = res.data.employee;
            setCurrentUser(emp);
            setInput((prev) => ({ ...prev, employeeId: emp.employeeId }));
          } else {
            throw new Error(res.message || "Failed to load user record");
          }
        }
      } catch (err: any) {
        if (!alive) return;
        console.error(err);
        Swal.fire("Error", err?.message || "Something went wrong", "error");
      } finally {
        if (!alive) return;
        setEmpLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  // Edit mode: load KPI record
  useEffect(() => {
    let alive = true;

    const loadKpi = async () => {
      if (!isEdit) {
        setLoading(false);
        return;
      }

      try {
        const res = await get<{ success: boolean; data?: any; message?: string }>(
          `/kpi/getByKpiId/${encodeURIComponent(kpiId)}`
        );

        if (!alive) return;

        if (res.success && res.data) {
          const d = res.data;
          setInput({
            employeeId: d.employeeId ?? "",
            projectName: d.projectName ?? "",
            startdate: d.startdate ?? "",
            deadline: d.deadline ?? "",
            remark: d.remark ?? d.Remark ?? "",
          });
        } else {
          await Swal.fire("Error", res.message || "Could not load KPI", "error");
          router.back();
        }
      } catch (e) {
        if (!alive) return;
        router.back();
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    loadKpi();

    return () => {
      alive = false;
    };
  }, [isEdit, kpiId, router]);

  const showEmployeeSelector = useMemo(() => !isEdit && canManageKpi, [isEdit, canManageKpi]);

  const currentEmp = useMemo(() => {
    return employees.find((e) => e.employeeId === input.employeeId) || currentUser;
  }, [employees, input.employeeId, currentUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // HARD GUARD: prevent multiple rapid submits (double click / spam click)
    if (isSubmitting) return;

    // Basic guard when adding
    if (!isEdit && !input.employeeId) {
      Swal.fire("Missing employee", "Please select an employee.", "warning");
      return;
    }

    setIsSubmitting(true);

    const endpoint = isEdit ? "/kpi/updateKPi" : "/kpi/addkpi";
    const payload = isEdit
      ? {
          kpiId,
          projectName: input.projectName,
          Remark: input.remark,
        }
      : {
          employeeId: input.employeeId,
          projectName: input.projectName,
          startdate: input.startdate,
          deadline: input.deadline,
          Remark: input.remark,
        };

    try {
      const res = await post<{ success: boolean; message?: string }>(endpoint, payload);

      if (res.success) {
        await Swal.fire({
          icon: "success",
          title: isEdit ? "KPI Updated" : "KPI Added",
          timer: 1200,
          showConfirmButton: false,
        });
        router.push("/kpi");
      } else {
        Swal.fire("Error", res.message || "Operation failed", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err?.message || "Please try again later", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || empLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-6">{isEdit ? "Edit" : "Add"} KPI</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>

            {showEmployeeSelector ? (
              <select
                name="employeeId"
                required
                value={input.employeeId}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">-- Select an employee --</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 bg-gray-100 rounded-md">
                {currentEmp?.name || input.employeeId || "—"}
              </div>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              name="projectName"
              type="text"
              required
              value={input.projectName}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              {isEdit ? (
                <div className="px-4 py-2 bg-gray-100 rounded-md">{input.startdate || "—"}</div>
              ) : (
                <input
                  name="startdate"
                  type="date"
                  required
                  value={input.startdate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              {isEdit ? (
                <div className="px-4 py-2 bg-gray-100 rounded-md">{input.deadline || "—"}</div>
              ) : (
                <input
                  name="deadline"
                  type="date"
                  required
                  value={input.deadline}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
              )}
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium mb-1">Remark</label>
            <textarea
              name="remark"
              value={input.remark}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/kpi"
              className={`px-6 py-2 border rounded-md hover:bg-gray-100 text-sm ${
                isSubmitting ? "pointer-events-none opacity-60" : ""
              }`}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        {/* (optional) debug */}
        {/* <pre className="mt-4 text-xs text-gray-400">{JSON.stringify({ userRole, canManageKpi }, null, 2)}</pre> */}
      </div>
    </div>
  );
};

export default AddUpdateKpiPage;

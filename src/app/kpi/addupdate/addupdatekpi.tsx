"use client";

import React, { FC, useState, useEffect, FormEvent } from "react";
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
  const kpiId = params.get("kpiId") ?? ""; // avoid non-null assertion
  const isEdit = Boolean(kpiId);

  // Role/permission state
  const [userRole, setUserRole] = useState<string>("");
  const [canManageKpi, setCanManageKpi] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Employee list/loading
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState<boolean>(true);

  // KPI input/loading
  const [input, setInput] = useState<KpiInput>({
    employeeId: "",
    projectName: "",
    startdate: "",
    deadline: "",
    remark: "",
  });
  const [loading, setLoading] = useState<boolean>(isEdit);

  /**
   * On mount: determine role + granular permissions and load employees accordingly.
   * Anyone with manage-KPI permission (admin or explicit permission) can add KPI for ANY employee.
   */
  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    const empIdLS = localStorage.getItem("employeeId") || "";
    // Align with KPI list page logic: admin OR (subadmin AND "Manage KPI" permission)
    let permsObj: Record<string, any> = {};
    try {
      permsObj = JSON.parse(localStorage.getItem("permissions") || "{}");
    } catch {}
    const canManageFlag =
      role === "admin" ||
      (role === "subadmin" && permsObj["Manage KPI"] === 1);

    setUserRole(role);
    setCanManageKpi(canManageFlag);

    // If user can manage KPIs, show the employee selector (we need the list)
    // Otherwise, lock to self by fetching their record
    const load = async () => {
      try {
        if (canManageFlag) {
          const res = await post<{ success: boolean; data: { employees: Employee[] } }>(
            "/employee/getlist",
            { page: 1, pageSize: 1000 }
          );
          if (res.success) {
            setEmployees(res.data.employees || []);
          } else {
            throw new Error("Failed to load employees");
          }
        } else {
          const res = await get<{
            success: boolean;
            data: { employee: Employee };
          }>(`/employee/getrecord?employeeId=${empIdLS}`);
          if (res.success) {
            const emp = res.data.employee;
            setCurrentUser(emp);
            setInput((prev) => ({ ...prev, employeeId: emp.employeeId }));
          } else {
            throw new Error("Failed to load user record");
          }
        }
      } catch (err: any) {
        console.error(err);
        Swal.fire("Error", err.message || "Something went wrong", "error");
      } finally {
        setEmpLoading(false);
      }
    };

    load();
  }, []);

  // Edit mode: load KPI data
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    get<{ success: boolean; data?: any; message?: string }>(`/kpi/getByKpiId/${kpiId}`)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setInput({
            employeeId: d.employeeId,
            projectName: d.projectName,
            startdate: d.startdate,
            deadline: d.deadline,
            remark: d.remark || d.Remark || "",
          });
        } else {
          Swal.fire("Error", res.message || "Could not load KPI", "error").then(() =>
            router.back()
          );
        }
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [isEdit, kpiId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic guard when adding: ensure an employee is selected if user can manage
    if (!isEdit && !input.employeeId) {
      Swal.fire("Missing employee", "Please select an employee.", "warning");
      return;
    }

    const endpoint = isEdit ? "/kpi/updateKPi" : "/kpi/addkpi";
    const payload: any = isEdit
      ? { kpiId, projectName: input.projectName, Remark: input.remark }
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
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/kpi");
      } else {
        Swal.fire("Error", res.message || "Operation failed", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err?.message || "Please try again later", "error");
    }
  };

  if (loading || empLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Display employee name for locked view
  const currentEmp =
    employees.find((e) => e.employeeId === input.employeeId) || currentUser;

  const showEmployeeSelector = !isEdit && canManageKpi; // key change: managers can assign KPIs to others when adding

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-6">{isEdit ? "Edit" : "Add"} KPI</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            {showEmployeeSelector ? (
              <select
                name="employeeId"
                required
                value={input.employeeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link href="/kpi" className="px-6 py-2 border rounded-md hover:bg-gray-100 text-sm">
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUpdateKpiPage;

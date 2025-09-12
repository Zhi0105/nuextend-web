import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useUserStore } from '@_src/store/auth';
import { Button } from "primereact/button";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { ReportForm } from "@_src/components/Partial/ReportForm";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { getReports, removeReport, uploadReport, approveReport, rejectReport } from "@_src/services/report";
import { toast } from "react-toastify";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BsTrash } from "react-icons/bs";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from "primereact/inputtextarea";
import _ from "lodash";
import dayjs from "dayjs";

// RAFC (arrow function) named Report; JS-only (no TS)
export const Report = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data, user_id } = location.state;

  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleRow, setVisibleRow] = useState(null);

  const { data: reportData, isLoading: reportLoading } = getReports({ token: decryptedToken, activity: data?.id });

  const { handleSubmit, control, watch, setValue, reset } = useForm({
    defaultValues: { reports: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "reports" });
  const reportsValues = watch("reports") || [];

  // Upload / Remove
  const { mutate: handleUploadReport, isLoading: uploadLoading } = useMutation({
    mutationFn: uploadReport,
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast(resp.message, { type: "success" });
      reset({ reports: [] });
    },
    onError: (error) => {
      console.log("@UE:", error);
      toast(error?.response?.data?.message ?? 'Upload failed', { type: "warning" });
    },
  });

  const { mutate: handleRemoveUploadedReport, isLoading: removeLoading } = useMutation({
    mutationFn: removeReport,
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast(resp.message, { type: "success" });
    },
    onError: (error) => {
      console.log("@RRE:", error);
    },
  });

  // Approvals (Commex role_id=1, ASD role_id=10)
  const { mutate: handleApproveReport, isLoading: approveLoading } = useMutation({
    mutationFn: approveReport,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const prev = queryClient.getQueryData(['reports']);
      queryClient.setQueryData(['reports'], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((r) => {
            if (r.id !== variables.id) return r;
            const roleId = variables.role_id;
            const roleFlagUpdates = roleId === 1 ? { is_commex: true }
              : roleId === 10 ? { is_asd: true }
              : {};
            return { ...r, ...roleFlagUpdates };
          })
        };
      });
      return { prev };
    },
    onSuccess: (resp) => toast(resp.message, { type: 'success' }),
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['reports'], ctx.prev);
      toast('Failed to approve. Please try again.', { type: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const { mutate: handleRejectReport, isLoading: rejectLoading } = useMutation({
    mutationFn: rejectReport,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      setVisibleRow(null);
    },
    onSuccess: (resp) => toast(resp.message, { type: 'success' }),
    onError: (err) => {
      console.log('@RejectError', err);
      toast('Failed to decline. Please try again.', { type: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  // Normalize rows
  const rows = useMemo(() => {
    const arr = reportData?.data ?? [];
    return (Array.isArray(arr) ? arr : []).map((item, idx) => ({
      id: item?.id ?? idx,
      activity_id: item?.activity_id ?? "",
      event_id: item?.event_id ?? "",
      name: item?.name ?? "",
      date: item?.date ?? item?.created_at ?? "",
      budget: typeof item?.budget === "number" ? item.budget : Number(item?.budget ?? 0),
      file: item?.file ?? "",
      code: item?.code ?? String(item?.id ?? idx),
      created_at: item?.created_at ?? "",
      updated_at: item?.updated_at ?? "",
      // approval flags limited to Commex + ASD
      is_commex: !!item?.is_commex,
      is_asd: !!item?.is_asd,
      commex_remarks: item?.commex_remarks ?? "",
      asd_remarks: item?.asd_remarks ?? "",
    }));
  }, [reportData]);

  // Status logic: 2 approvers total
  const deriveStatusFromRow = (r) => {
    const approvalsCount = Number(!!r.is_commex) + Number(!!r.is_asd);
    const hasAnyRemarks = [r.commex_remarks, r.asd_remarks].some((x) => (x?.length || 0) > 0);
    const required = 2; // only commex + asd
    let status = 'pending_review';
    if (hasAnyRemarks) status = 'declined';
    else if (approvalsCount >= required) status = 'approved';
    return { approvalsCount, required, status };
  };

  const displayStatusText = (status, approvalsCount, hasFile, required) => {
    if (!hasFile) return `Pending 0/${required}`;
    if (status === 'declined') return 'For Revision';
    if (status === 'approved') return 'Approved';
    const safe = Math.min(approvalsCount || 0, required);
    return safe > 0 ? `Approved ${safe}/${required}` : 'Pending';
  };

  const statusColor = (status) => {
    if (status === 'approved') return 'text-emerald-700';
    if (status === 'declined') return 'text-rose-700';
    if (status === 'pending_review') return 'text-amber-600';
    return 'text-slate-500';
  };

  const hasUserRoleApproved = (row) => {
    switch (decryptedUser?.role_id) {
      case 1: return !!row.is_commex;
      case 10: return !!row.is_asd;
      default: return false;
    }
  };

  // Report form handlers
  const onAddReport = () => append({ event_id: data?.event_id, activity_id: data?.id, name: "", file: null, date: null, budget: 0 });
  const onRemoveReport = (index) => remove(index);
  const onReportChange = (index, key, value) => setValue(`reports.${index}.${key}`, value, { shouldDirty: true, shouldValidate: true });

  const onSubmit = (form) => {
    const formatted = (form.reports || []).map((r) => ({
      ...r,
      date: r.date ? dayjs(r.date).format("MM-DD-YYYY") : "",
    }));
    handleUploadReport({ token: decryptedToken, reports: [...formatted] });
  };

  // Aggregates
  const totalBudget = useMemo(() => (rows || []).reduce((sum, r) => sum + (Number.isFinite(r.budget) ? r.budget : Number(r.budget ?? 0)), 0), [rows]);
  const totalBudgetFormatted = useMemo(() => totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [totalBudget]);


  // Column renderers
  const fileBody = (row) => row.file ? (
    <a href={`${import.meta.env.VITE_API_URL}${_.trimStart(row.file, '/')}`} target="_blank" rel="noreferrer" className="text-blue-600">View</a>
  ) : ("-");

  const budgetBody = (row) => Number.isFinite(row.budget) ? row.budget.toLocaleString() : "-";

  const statusBody = (row) => {
    const { approvalsCount, required, status } = deriveStatusFromRow(row);
    const label = displayStatusText(status, approvalsCount, !!row?.file, required);
    const colorClass = statusColor(status);

    const safeString = (val) =>
      val == null ? null : typeof val === "object" ? JSON.stringify(val) : String(val);

    // Build tooltip lines conditionally
    const tooltipParts = [];
    const commex = safeString(row?.commex_remarks);
    const asd = safeString(row?.asd_remarks);

    if (commex) tooltipParts.push(`commex's remarks: ${commex}`);
    if (asd) tooltipParts.push(`asd's remarks: ${asd}`);

    const tooltipText = tooltipParts.length > 0 ? tooltipParts.join("\n") : "No remarks";

    return (
      <span className={`font-medium ${colorClass}`}>
        <Tooltip target=".has-tooltip" position="right" />

        <label
          className="label has-tooltip cursor-help whitespace-pre-line"
          data-pr-tooltip={tooltipText}
        >
          {label}
        </label>
      </span>
    );
  };

  const approveDeclineBody = (row) => {
    const isApprover = [1, 10].includes(decryptedUser?.role_id);
    const alreadyApprovedByMe = hasUserRoleApproved(row);
    const hasFile = !!row.file;
    const { status, approvalsCount, required } = deriveStatusFromRow(row);
    const disabledActions = !hasFile || status === 'declined' || approvalsCount >= required;
    const canSee = isApprover && hasFile && !alreadyApprovedByMe && status !== 'approved';
    if (!canSee) return null;

    const onApprove = () => handleApproveReport({ token: decryptedToken, id: row.id, role_id: decryptedUser?.role_id, code: row.code });

    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={disabledActions || approveLoading}
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setVisibleRow(row)}
          disabled={disabledActions || rejectLoading}
          className="inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Revise
        </button>
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    const { status } = deriveStatusFromRow(rowData); // <-- check status here
    const isApproved = status === "approved";

    return (
      <div className="flex gap-8">
        <button
          disabled={removeLoading || isApproved} // <-- disable if approved
          onClick={() =>
            handleRemoveUploadedReport({
              token: decryptedToken,
              report_id: rowData?.id,
            })
          }
        >
          <Tooltip target=".delete" content="Delete" position="right" />
          <BsTrash
            className={`delete w-7 h-7 ${
              isApproved ? "text-gray-400 cursor-not-allowed" : "text-[#364190]"
            }`}
          />
        </button>
      </div>
    );
};

  // Reject dialog
  const RejectDialog = ({ rowData }) => {
    const { handleSubmit: onDialogSubmit, control, formState: { errors } } = useForm({ defaultValues: { remarks: "" } });

    const submit = (vals) => {
      const remarksKeyByRole = { 1: 'commex_remarks', 10: 'asd_remarks' };
      const key = remarksKeyByRole[decryptedUser?.role_id];
      if (!key) return;
      handleRejectReport({ token: decryptedToken, id: rowData?.id, role_id: decryptedUser?.role_id, code: rowData?.code, [key]: vals?.remarks });
    };

    return (
      <form onSubmit={onDialogSubmit(submit)} className="bg-transparent flex flex-col gap-4 w-full my-4">
        <Controller
          control={control}
          name="remarks"
          rules={{ required: true }}
          render={({ field }) => (
            <InputTextarea
              {...field}
              rows={4}
              placeholder="Enter your remarks here"
              className={`${errors.remarks ? 'border border-red-500' : ''} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
            />
          )}
        />
        {errors.remarks && (
          <p className="text-sm italic mt-1 text-red-400 indent-2">remarks is required.*</p>
        )}
        <Button type="submit" disabled={rejectLoading} className="bg-[#2211cc] text-[#c7c430] font-bold rounded-lg p-2">
          Submit
        </Button>
      </form>
    );
  };

  if (reportLoading) {
    return (
      <div className="report-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">Loading reports...</div>
    );
  }

  const isApproverUser = [1, 10].includes(decryptedUser?.role_id);

  return (
    <div className="report-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
      {/* Upload form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-transparent flex flex-col gap-4 w-1/2 my-8">
        <div>
          <div className="w-full capitalize flex flex-col gap-2">
            <ReportForm
              reports={reportsValues}
              reportsKeys={fields.map((f) => f.id)}
              onRemove={onRemoveReport}
              onChange={onReportChange}
            />
            <span className="text-[25px] text-[#5b9bd1] cursor-pointer" onClick={onAddReport}>+</span>
          </div>
          <div className="flex pt-4 justify-between">
            <Button
              disabled={uploadLoading}
              type="submit"
              className="w-full bg-[#2211cc] text-[#c7c430] px-4 py-2"
              label={uploadLoading ? "uploading..." : "submit"}
              iconPos="right"
            />
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="w-full lg:w-11/12 mb-6">
        <div className="flex items-center gap-2 px-2 mb-3">
          <InputText
            className="text-sm p-2"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search reports"
          />
        </div>

        <DataTable
          size="normal"
          value={rows}
          dataKey="id"
          paginator
          rows={10}
          removableSort
          emptyMessage="No reports found."
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reports"
          globalFilter={globalFilter}
          globalFilterFields={["name","date","budget","id","event_id","activity_id","file","code"]}
        >
          <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="id" header="ID" sortable />
          <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name" sortable />
          <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="date" header="Date" sortable />
          <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="budget" header="Budget" body={budgetBody} sortable />
          <Column headerClassName="bg-[#364190] text-white" className="font-bold" header="File" body={fileBody} />
          <Column headerClassName="bg-[#364190] text-white" className="font-bold" header="Status" body={statusBody} />
          {isApproverUser && (
            <Column headerClassName="bg-[#364190] text-white" className="font-bold" header="Approve / Decline" body={approveDeclineBody} />
          )}
          {user_id === decryptedUser?.id && (
            <Column headerClassName="bg-[#FCA712] text-white" className="font-bold" header="Action" body={actionBodyTemplate} />
          )}
        </DataTable>
        <div>
          <h1><span className="font-bold text-xl">Total Budget : </span>₱ {totalBudgetFormatted}</h1>
        </div>
      </div>

      <Dialog
        header="Remarks"
        visible={!!visibleRow}
        style={{ width: '50vw' }}
        onHide={() => setVisibleRow(null)}
        modal={false}
      >
        {visibleRow && <RejectDialog rowData={visibleRow} />}
      </Dialog>
    </div>
  );
};

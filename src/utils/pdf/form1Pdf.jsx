// src/utils/form1Pdf.js
import pdfMake from "../pdfmake";


export const downloadForm1Pdf = (form1, event) => {
  const docDefinition = {
    content: [
      { text: "Program Proposal", style: "header" },

      { text: `A. Title: ${event?.eventName || "—"}`, style: "field" },
      { text: `B. Implementer: ${event?.organization?.name || "—"}`, style: "field" },

      { text: "C. Extension Program Management Team", style: "subheader" },
      { text: `1. Coordinator: ${event?.user?.firstname} ${event?.user?.lastname || ""}`, style: "field" },

      {
        text: "2. Program Team Members:",
        style: "field",
      },
      {
        ul: form1[0]?.team_members?.map((m) => m.name) || ["No team members"],
      },

      { text: `D. Target Group: ${event?.target_group || "—"}`, style: "field" },

      { text: "E. Cooperating Agencies", style: "subheader" },
      {
        ul: form1[0]?.cooperating_agencies?.map((a) => a.name) || ["No agencies"],
      },

      { text: `F. Duration: ${form1[0]?.duration || "—"}`, style: "field" },
      { text: `G. Proposed Budget: ₱${event?.budget_proposal?.toLocaleString() || "0.00"}`, style: "field" },

      { text: "II. PROGRAM DETAILS", style: "header" },
      { text: `A. Background: ${form1[0]?.background || "—"}`, style: "field" },
      { text: `B. Overall Goal: ${form1[0]?.overall_goal || "—"}`, style: "field" },

      { text: "C. Component Projects, Outcomes, and Budget", style: "subheader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto"],
          body: [
            ["Title", "Outcomes", "Budget"],
            ...(form1[0]?.component_projects?.length > 0
              ? form1[0].component_projects.map((c) => [c.title, c.outcomes, `₱${c.budget}`])
              : [["—", "—", "—"]]),
          ],
        },
        layout: "lightHorizontalLines",
      },

      { text: `Scholarly Connection: ${form1[0]?.scholarly_connection || "—"}`, style: "field" },

      { text: "III. PROJECT DETAILS", style: "header" },
      ...(form1[0]?.projects?.length > 0
        ? form1[0].projects.map((p) => [
            { text: `Project: ${p.title}`, style: "subheader" },
            { text: `Team Leader: ${p.teamLeader}`, style: "field" },
            { text: `Objectives: ${p.objectives}`, style: "field" },
            { text: "Team Members", style: "field" },
            {
              ul: p.team_members?.map((tm) => tm.name) || ["No team members"],
            },
            { text: "Budget Summary", style: "field" },
            {
              table: {
                headerRows: 1,
                widths: ["*", "*", "*", "*", "auto"],
                body: [
                  ["Activities", "Outputs", "Timeline", "Personnel", "Budget"],
                  ...(p.budget_summaries?.length > 0
                    ? p.budget_summaries.map((b) => [
                        b.activities,
                        b.outputs,
                        b.timeline,
                        b.personnel,
                        `₱${b.budget}`,
                      ])
                    : [["—", "—", "—", "—", "—"]]),
                ],
              },
              layout: "lightHorizontalLines",
            },
          ])
        : [{ text: "No projects", style: "field" }]),
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
      subheader: { fontSize: 14, bold: true, margin: [0, 8, 0, 4] },
      field: { fontSize: 12, margin: [0, 2, 0, 2] },
    },
    defaultStyle: {
      fontSize: 11,
    },
  };

  pdfMake.createPdf(docDefinition).download("form1-proposal.pdf");
};

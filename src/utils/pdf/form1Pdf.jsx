// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const downloadForm1Pdf = (form1, event, owner, roleId) => {
  console.log("downloadForm1Pdf called", { form1, event, owner, roleId });

  if (!form1) {
    console.warn("downloadForm1Pdf: no form1 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form1) ? form1[0] || {} : form1 || {};

  const content = [];

  // I. PROGRAM DESCRIPTION header
  content.push({
    text: "I. PROGRAM DESCRIPTION:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Title
  content.push({ text: "A. Title", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: event?.eventName || event?.title || f?.title || "—", margin: [20, 0, 0, 8] });

  // B. Implementer
  content.push({ text: "B. Implementer", bold: true, margin: [0, 4, 0, 2] });
  const implementer = event?.organization?.name || f?.implementer || "—";
  content.push({ text: implementer, margin: [20, 0, 0, 8] });

  // C. Extension Program Management Team
  content.push({
    text: "C. Extension Program Management Team",
    bold: true,
    margin: [0, 6, 0, 4],
  });

  // 1. Program Coordinator (plain numbered text)
  content.push({ text: "1. Program Coordinator", italics: false, margin: [15, 2, 0, 2] });
  const coordinator =
    `${event?.user?.firstname || owner?.firstname || f?.coordinatorFirstName || ""} ${event?.user?.middlename || owner?.middlename || f?.coordinatorMiddleName || ""} ${event?.user?.lastname || owner?.lastname || f?.coordinatorLastName || ""}`.trim()
      || f?.coordinator
      || "—";
  content.push({ text: coordinator, margin: [30, 0, 0, 8] });

  // 2. Program Team Members (render each name as its own text line to avoid list rendering quirks)
  content.push({ text: "2. Program Team Members", italics: false, margin: [15, 2, 0, 2] });
  if (f?.team_members && f.team_members.length > 0) {
    f.team_members.forEach((m) => {
      content.push({ text: m?.name || "—", margin: [30, 0, 0, 4] });
    });
  } else {
    content.push({ text: "No team members", margin: [30, 0, 0, 6] });
  }

  // D. Target Group
  content.push({ text: "D. Target Group", bold: true, margin: [0, 6, 0, 2] });
  content.push({ text: event?.target_group || f?.target_group || "—", margin: [20, 0, 0, 8] });

  // E. Cooperating Agencies
  content.push({ text: "E. Cooperating Agencies", bold: true, margin: [0, 6, 0, 2] });
  if (f?.cooperating_agencies && f.cooperating_agencies.length > 0) {
    f.cooperating_agencies.forEach((a) => {
      content.push({ text: a?.name || "—", margin: [30, 0, 0, 4] });
    });
  } else {
    content.push({ text: "No cooperating agencies", margin: [30, 0, 0, 6] });
  }

  // F. Duration
  content.push({ text: "F. Duration", bold: true, margin: [0, 6, 0, 2] });
  content.push({ text: f?.duration || "—", margin: [20, 0, 0, 8] });

  // G. Proposed Budget
  content.push({ text: "G. Proposed Budget", bold: true, margin: [0, 6, 0, 2] });
  const budgetText = event?.budget_proposal ? `₱ ${Number(event.budget_proposal).toLocaleString()}` : "₱ 0.00";
  content.push({ text: budgetText, margin: [20, 0, 0, 10] });

  // II. PROGRAM DETAILS
  content.push({ text: "II. PROGRAM DETAILS:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  // A. Background
  content.push({ text: "A. Background", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.background || "—", margin: [20, 0, 0, 8] });

  // B. Overall Goal
  content.push({ text: "B. Overall Goal", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.overall_goal || "—", margin: [20, 0, 0, 8] });

  // C. Component Projects - table
  content.push({ text: "C. Component Projects, Outcomes, and Budget", bold: true, margin: [0, 6, 0, 4] });

  const componentBody = [
    [
      { text: "Title", bold: true },
      { text: "Outcomes", bold: true },
      { text: "Budget", bold: true },
    ],
  ];

  if (f?.component_projects && f.component_projects.length > 0) {
    f.component_projects.forEach((c) => {
      componentBody.push([
        c?.title || "—",
        c?.outcomes || "—",
        c?.budget ? `₱ ${c.budget}` : "₱ 0.00",
      ]);
    });
  } else {
    componentBody.push(["—", "—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["30%", "50%", "20%"], body: componentBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [10, 0, 0, 10],
  });

  // Scholarly Connection
  content.push({ text: "Scholarly Connection", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.scholarly_connection || "—", margin: [20, 0, 0, 10] });

  // III. PROJECT DETAILS
  content.push({ text: "III. PROJECT DETAILS:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  if (f?.projects && f.projects.length > 0) {
    f.projects.forEach((p, index) => {
      // Project Header
      content.push({
        text: `Project ${index + 1}: ${p?.title || "—"}`,
        bold: true,
        fontSize: 12,
        margin: [0, 8, 0, 6],
      });

      // Team Leader
      content.push({
        text: `Team Leader: ${p?.teamLeader || "—"}`,
        margin: [20, 0, 0, 4],
      });

      // Team Members
      content.push({ text: "Project Team Members:", italics: true, margin: [20, 2, 0, 2] });
      if (p?.team_members && p.team_members.length > 0) {
        p.team_members.forEach((tm) => {
          content.push({ text: tm?.name || "—", margin: [30, 0, 0, 4] });
        });
      } else {
        content.push({ text: "No team members", margin: [30, 0, 0, 6] });
      }

      // Objectives
      content.push({ text: "Objectives:", italics: true, margin: [20, 6, 0, 2] });
      content.push({ text: p?.objectives || "—", margin: [30, 0, 0, 6] });

      // Budget Summary
      content.push({ text: "Budget Summary", italics: true, margin: [20, 8, 0, 4] });

      const budgetBody = [
        [
          { text: "Activities", bold: true },
          { text: "Outputs", bold: true },
          { text: "Timeline", bold: true },
          { text: "Personnel", bold: true },
          { text: "Budget", bold: true },
        ],
      ];

      if (p?.budget_summaries && p.budget_summaries.length > 0) {
        p.budget_summaries.forEach((b) => {
          budgetBody.push([
            b?.activities || "—",
            b?.outputs || "—",
            b?.timeline || "—",
            b?.personnel || "—",
            b?.budget ? `₱ ${Number(b.budget).toLocaleString()}` : "₱ 0.00",
          ]);
        });
      } else {
        budgetBody.push(["—", "—", "—", "—", "—"]);
      }

      content.push({
        table: {
          headerRows: 1,
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: budgetBody,
        },
        layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
        margin: [30, 0, 0, 10],
      });
    });
  } else {
    content.push({ text: "No projects", margin: [0, 6, 0, 6] });
  }

  // PREPARED BY SECTION - Only show for roleId 3 (student) or 4 (faculty)
  content.push({ 
    text: "Prepared By:", 
    bold: true, 
    fontSize: 13, 
    margin: [0, 20, 0, 10] 
  });

  // Get coordinator details
  const coordinatorFirstName = event?.user?.firstname || owner?.firstname || f?.coordinatorFirstName || "";
  const coordinatorMiddleName = event?.user?.middlename || owner?.middlename || f?.coordinatorMiddleName || "";
  const coordinatorLastName = event?.user?.lastname || owner?.lastname || f?.coordinatorLastName || "";
  const coordinatorFullName = `${coordinatorFirstName} ${coordinatorMiddleName} ${coordinatorLastName}`.trim();
  const coordinatorContact = event?.user?.contact || owner?.contact || f?.coordinatorContact || "—";
  const coordinatorEmail = event?.user?.email || owner?.email || f?.coordinatorEmail || "—";

  // Checkboxes for Faculty Member / Student - only show for roleId 3 or 4
  if (roleId === 3 || roleId === 4) {
    content.push({
      columns: [
        {
          width: 'auto',
          stack: [
            { 
              text: roleId === 4 ? "☒ Faculty Member" : "☐ Faculty Member", 
              margin: [0, 0, 20, 0] 
            }
          ]
        },
        {
          width: 'auto',
          stack: [
            { 
              text: roleId === 3 ? "☒ Student" : "☐ Student", 
              margin: [0, 0, 0, 0] 
            }
          ]
        }
      ],
      margin: [0, 0, 0, 15]
    });
  }

  // Program Coordinator details - show for all roles
  content.push({
    stack: [
      { text: `Program Coordinator: ${coordinatorFullName || "—"}` },
      { text: `Mobile Number: ${coordinatorContact}` },
      { text: `Email Address: ${coordinatorEmail}` }
    ],
    margin: [0, 0, 0, 20]
  });

  // ADD PAGE BREAK BEFORE CONSENT SECTION
  content.push({ 
    text: '', 
    pageBreak: 'before'  // This forces a new page for the consent section
  });

  // CONSENT SECTION - With E-Signatures
  content.push({ 
    text: "Consent", 
    bold: true, 
    fontSize: 16, 
    margin: [0, 20, 0, 15],
    alignment: 'center'
  });

  // Helper function to create approval cell with VERY LARGE e-signatures but compact layout
  const createApprovalCell = (approved, approver, approveDate, title) => {
    const isApproved = !!approved;
    const approverName = approver ? `${approver.firstname || ''} ${approver.lastname || ''}`.trim() : '';
    const signatureBase64 = approver?.esign;
    
    const cellContent = [];

    // Add signature image - VERY LARGE but with minimal spacing
    if (isApproved && signatureBase64) {
      cellContent.push({
        image: signatureBase64,
        width: 220,  // Large signature
        height: 100,  // Large signature
        alignment: 'center',
        margin: [0, -30, 0, -30] // Minimal margin below signature
      });
    } else if (isApproved) {
      cellContent.push({
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 160, y2: 0, // Long line
            lineWidth: 1,
            lineColor: 'black'
          }
        ],
        margin: [0, 8, 0, 1]
      });
    } else {
      cellContent.push({
        text: ' ',
        margin: [0, 8, 0, 1]
      });
    }

    // Status below signature - very compact
    cellContent.push({
      text: isApproved ? 'Approved' : 'Awaiting Approval',
      bold: isApproved,
      color: isApproved ? 'green' : 'gray',
      italic: !isApproved,
      alignment: 'center',
      margin: [0, 0, 0, 0], // No margin
      fontSize: 9
    });

    // Approver name - CAPITAL LETTERS and compact
    cellContent.push({
      text: approverName ? approverName.toUpperCase() : (isApproved ? '—' : ''), // Convert to uppercase
      alignment: 'center',
      margin: [0, 0, 0, 0], // No margin
      fontSize: 9,
      bold: true
    });

    // Title - very compact
    cellContent.push({
      text: title,
      alignment: 'center',
      fontSize: 8,
      color: 'gray',
      margin: [0, 0, 0, 0] // No margin
    });

    // Date - very compact
    if (approveDate) {
      cellContent.push({
        text: new Date(approveDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        alignment: 'center',
        fontSize: 8,
        color: 'gray',
        margin: [0, 0, 0, 0] // No margin
      });
    } else {
      cellContent.push({
        text: 'Date: ______________',
        alignment: 'center',
        fontSize: 8,
        color: 'gray',
        margin: [0, 0, 0, 0] // No margin
      });
    }

    return {
      stack: cellContent,
      alignment: 'center',
      margin: [0, 0, 0, 0] // No margin around entire cell
    };
  };

  // Check if Dean has approved to conditionally show the column
  const hasDeanApproval = !!f?.dean_approved_by;
  
  // Define table structure based on whether Dean approval exists
  let approvalTableConfig;
  
  if (hasDeanApproval) {
    // Show all 4 columns: ComEx, ASD, AD, and Dean
    approvalTableConfig = {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Services Director', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Director', style: 'tableHeader', alignment: 'center' },
          { text: 'Dean', style: 'tableHeader', alignment: 'center' }
        ],
        [
          // ComEx cell
          createApprovalCell(
            f?.commex_approved_by,
            f?.commex_approver,
            f?.commex_approve_date,
            'ComEx Coordinator'
          ),
          // ASD cell
          createApprovalCell(
            f?.asd_approved_by,
            f?.asd_approver,
            f?.asd_approve_date,
            'Academic Services Director'
          ),
          // AD cell
          createApprovalCell(
            f?.ad_approved_by,
            f?.ad_approver,
            f?.ad_approve_date,
            'Academic Director'
          ),
          // Dean cell
          createApprovalCell(
            f?.dean_approved_by,
            f?.dean_approver,
            f?.dean_approve_date,
            'Dean'
          )
        ]
      ]
    };
  } else {
    // Show only 3 columns: ComEx, ASD, AD
    approvalTableConfig = {
      widths: ['33%', '33%', '34%'],
      body: [
        [
          { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Services Director', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Director', style: 'tableHeader', alignment: 'center' }
        ],
        [
          // ComEx cell
          createApprovalCell(
            f?.commex_approved_by,
            f?.commex_approver,
            f?.commex_approve_date,
            'ComEx Coordinator'
          ),
          // ASD cell
          createApprovalCell(
            f?.asd_approved_by,
            f?.asd_approver,
            f?.asd_approve_date,
            'Academic Services Director'
          ),
          // AD cell
          createApprovalCell(
            f?.ad_approved_by,
            f?.ad_approver,
            f?.ad_approve_date,
            'Academic Director'
          )
        ]
      ]
    };
  }

  // MERGED APPROVAL TABLE - Conditionally shows 3 or 4 columns
  const mergedApprovalTable = {
    table: {
      headerRows: 1,
      ...approvalTableConfig,
      heights: [15, 70] // Compact fixed heights
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 1; },
      paddingRight: function(i, node) { return 1; },
      paddingTop: function(i, node) { return 0; },
      paddingBottom: function(i, node) { return 0; },
    },
    margin: [0, 0, 0, 20]
  };

  content.push(mergedApprovalTable);

  // RECEIVED BY SECTION - at the very bottom
  content.push({ 
    text: "Received By:", 
    bold: true, 
    fontSize: 13, 
    margin: [0, 25, 0, 8] 
  });

  const receivedByTable = {
    table: {
      headerRows: 1,
      widths: ['100%'],
      body: [
        // First row: Community Extension Office
        [
          { 
            text: 'Community Extension Office', 
            alignment: 'center',
            bold: true,
            margin: [0, 6, 0, 6]
          }
        ],
        // Second row: Signature and Date/Time
        [
          {
            columns: [
              {
                width: '60%',
                stack: [
                  { text: ' ', margin: [0, 12, 0, 0] },
                  { text: 'Signature Over Printed Name', margin: [0, 15, 0, 4] }
                ]
              },
              {
                width: '40%',
                stack: [
                  { text: 'Date: ________________', margin: [0, 15, 0, 4] },
                  { text: 'Time: ________________', margin: [0, 12, 0, 0] }
                ]
              }
            ]
          }
        ],
        // Third row: ComEx Coordinator
        [
          { 
            text: 'ComEx Coordinator', 
            alignment: 'center',
            margin: [0, 6, 0, 6]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 6; },
      paddingRight: function(i, node) { return 6; },
      paddingTop: function(i, node) { return 6; },
      paddingBottom: function(i, node) { return 6; },
    },
    margin: [0, 0, 0, 15]
  };

  content.push(receivedByTable);

  const docDefinition = {
    content,
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 10,
        margin: [0, 3, 0, 3]
      }
    },
    defaultStyle: { 
      fontSize: 11, 
      lineHeight: 1.15 
    },
    pageMargins: [40, 40, 40, 40],
  };

  pdfMake.createPdf(docDefinition).download("form1-proposal.pdf");
};
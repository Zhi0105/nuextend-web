// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const downloadForm2Pdf = (form2, event, owner, roleId) => {
  console.log("downloadForm2Pdf called", { form2, event, owner, roleId });

  if (!form2) {
    console.warn("downloadForm2Pdf: no form2 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form2) ? form2[0] || {} : form2 || {};
  const eventName = event?.eventName || event?.title || f?.title || "—";

  const content = [];

  // I. PROJECT DESCRIPTION header
  content.push({
    text: "I. PROJECT DESCRIPTION:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Title
  content.push({ text: "A. Project Title", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: eventName, margin: [20, 0, 0, 8] });

  // B. Type of Project
  content.push({ text: "B. Type of Project", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.event_type?.name || "—", margin: [20, 0, 0, 8] });

  // C. Project Proponent(s)
  content.push({ text: "C. Project Proponent(s)", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.proponents || "—", margin: [20, 0, 0, 8] });

  // D. Project Collaborator(s)
  content.push({ text: "D. Project Collaborator(s)", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.collaborators || "—", margin: [20, 0, 0, 8] });

  // E. Number of Participants
  content.push({ text: "E. Number of Participants", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.participants || "—", margin: [20, 0, 0, 8] });

  // F. Project Partner(s)
  content.push({ text: "F. Project Partner(s)", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.partners || "—", margin: [20, 0, 0, 8] });

  // G. Date of Implementation
  content.push({ text: "G. Date of Implementation and Duration in Hours", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.implementationDate || "—", margin: [20, 0, 0, 8] });

  // H. Area of Project Implementation
  content.push({ text: "H. Area of Project Implementation", bold: true, margin: [0, 4, 0, 2] });
  content.push({ text: f?.area || "—", margin: [20, 0, 0, 8] });

  // I. Budget Requirement
  content.push({ text: "I. Budget Requirement", bold: true, margin: [0, 4, 0, 2] });
  const budgetReqText = f?.budgetRequirement ? `₱ ${Number(f.budgetRequirement).toLocaleString()}` : "₱ 0.00";
  content.push({ text: budgetReqText, margin: [20, 0, 0, 8] });

  // J. Budget Requested
  content.push({ text: "J. Budget Requested", bold: true, margin: [0, 4, 0, 2] });
  const budgetReqdText = f?.budgetRequested ? `₱ ${Number(f.budgetRequested).toLocaleString()}` : "₱ 0.00";
  content.push({ text: budgetReqdText, margin: [20, 0, 0, 10] });

  // II. BACKGROUND/SITUATION ANALYSIS
  content.push({ text: "II. BACKGROUND/SITUATION ANALYSIS:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });
  content.push({ text: f?.background || "—", margin: [0, 0, 0, 10] });

  // III. PROJECT OBJECTIVES
  content.push({ text: "III. PROJECT OBJECTIVES:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const objectivesBody = [
    [
      { text: "Objectives", bold: true },
      { text: "Strategies", bold: true },
    ],
  ];

  if (f?.objectives && f.objectives.length > 0) {
    f.objectives.forEach((obj) => {
      objectivesBody.push([
        obj?.objectives || "—",
        obj?.strategies || "—",
      ]);
    });
  } else {
    objectivesBody.push(["—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["50%", "50%"], body: objectivesBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // IV. DESIRED IMPACT AND OUTCOME
  content.push({ text: "IV. DESIRED IMPACT AND OUTCOME OF THE PROJECT:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const impactBody = [
    [
      { text: "Impact", bold: true },
      { text: "Outcome", bold: true },
      { text: "Linkage", bold: true },
    ],
  ];

  if (f?.impact_outcomes && f.impact_outcomes.length > 0) {
    f.impact_outcomes.forEach((impact) => {
      impactBody.push([
        impact?.impact || "—",
        impact?.outcome || "—",
        impact?.linkage || "—",
      ]);
    });
  } else {
    impactBody.push(["—", "—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["33%", "33%", "34%"], body: impactBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // V. RISK MANAGEMENT
  content.push({ text: "V. RISK MANAGEMENT:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const riskBody = [
    [
      { text: "Risk Identification", bold: true },
      { text: "Risk Mitigation", bold: true },
    ],
  ];

  if (f?.risks && f.risks.length > 0) {
    f.risks.forEach((risk) => {
      riskBody.push([
        risk?.risk_identification || "—",
        risk?.risk_mitigation || "—",
      ]);
    });
  } else {
    riskBody.push(["—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["50%", "50%"], body: riskBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // VI. PROJECT ORGANIZATION AND STAFFING
  content.push({ text: "VI. PROJECT ORGANIZATION AND STAFFING:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const staffingBody = [
    [
      { text: "Office Staff Designated", bold: true },
      { text: "Responsibilities", bold: true },
      { text: "Contact Details", bold: true },
    ],
  ];

  if (f?.staffings && f.staffings.length > 0) {
    f.staffings.forEach((staff) => {
      staffingBody.push([
        staff?.staff || "—",
        staff?.responsibilities || "—",
        staff?.contact || "—",
      ]);
    });
  } else {
    staffingBody.push(["—", "—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["33%", "34%", "33%"], body: staffingBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // VII. PROJECT WORK PLAN
  content.push({ text: "VII. PROJECT WORK PLAN:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const workPlanBody = [
    [
      { text: "Phases of Project and Date", bold: true, fontSize: 8 },
      { text: "Activities", bold: true, fontSize: 8 },
      { text: "Targets and Outputs", bold: true, fontSize: 8 },
      { text: "Indicators and Outcomes", bold: true, fontSize: 8 },
      { text: "Personnel In Charge", bold: true, fontSize: 8 },
      { text: "Resources Needed", bold: true, fontSize: 8 },
      { text: "Cost", bold: true, fontSize: 8 },
    ],
  ];

  if (f?.work_plans && f.work_plans.length > 0) {
    f.work_plans.forEach((work) => {
      workPlanBody.push([
        { text: work?.phaseDate || "—", fontSize: 8 },
        { text: work?.activities || "—", fontSize: 8 },
        { text: work?.targets || "—", fontSize: 8 },
        { text: work?.indicators || "N/A", fontSize: 8 },
        { text: work?.personnel || "N/A", fontSize: 8 },
        { text: work?.resources || "N/A", fontSize: 8 },
        { text: work?.cost ? `₱ ${work.cost}` : "₱ 0.00", fontSize: 8 },
      ]);
    });
  } else {
    workPlanBody.push([
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
      { text: "—", fontSize: 8 },
    ]);
  }

  content.push({
    table: { headerRows: 1, widths: ["14%", "14%", "14%", "14%", "14%", "15%", "15%"], body: workPlanBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // VIII. DETAILED BUDGET REQUIREMENT
  content.push({ text: "VIII. DETAILED BUDGET REQUIREMENT:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });

  const budgetBody = [
    [
      { text: "Budget Item", bold: true },
      { text: "Description", bold: true },
      { text: "Quantity", bold: true },
      { text: "Amount", bold: true },
      { text: "Proposed Source(s)", bold: true },
    ],
  ];

  if (f?.detailed_budgets && f.detailed_budgets.length > 0) {
    f.detailed_budgets.forEach((budget) => {
      budgetBody.push([
        budget?.item || "—",
        budget?.description || "—",
        budget?.quantity || "—",
        budget?.amount ? `₱ ${Number(budget.amount).toLocaleString()}` : "₱ 0.00",
        budget?.source || "N/A",
      ]);
    });
  } else {
    budgetBody.push(["—", "—", "—", "—", "—"]);
  }

  content.push({
    table: { headerRows: 1, widths: ["20%", "25%", "15%", "20%", "20%"], body: budgetBody },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  // IX. OTHER RELEVANT INFORMATION
  content.push({ text: "IX. OTHER RELEVANT INFORMATION:", bold: true, fontSize: 13, margin: [0, 10, 0, 8] });
  content.push({ text: f?.otherInfo || "—", margin: [0, 0, 0, 20] });

  // PREPARED BY SECTION - Only show for roleId 3 (student) or 4 (faculty)
  content.push({ 
    text: "Prepared By:", 
    bold: true, 
    fontSize: 13, 
    margin: [0, 20, 0, 10] 
  });

  // Get coordinator details
  const coordinatorFirstName = event?.user?.firstname || owner?.firstname || "";
  const coordinatorMiddleName = event?.user?.middlename || owner?.middlename || "";
  const coordinatorLastName = event?.user?.lastname || owner?.lastname || "";
  const coordinatorFullName = `${coordinatorFirstName} ${coordinatorMiddleName} ${coordinatorLastName}`.trim();
  const coordinatorContact = event?.user?.contact || owner?.contact || "—";
  const coordinatorEmail = event?.user?.email || owner?.email || "—";

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

  pdfMake.createPdf(docDefinition).download("form2-project-proposal.pdf");
};
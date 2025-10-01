// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}
// utils/pdfGenerator.js - Add this function for Form3
export const downloadForm3Pdf = (form3, event, owner, roleId) => {
  console.log("downloadForm3Pdf called", { form3, event, owner, roleId });

  if (!form3) {
    console.warn("downloadForm3Pdf: no form3 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form3) ? form3[0] || {} : form3 || {};
  const eventName = event?.eventName || event?.title || f?.title || "—";

  const content = [];

  // TITLE
  content.push({
    text: "TITLE:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: eventName, margin: [0, 0, 0, 15] });

  // BRIEF DESCRIPTION AND RATIONALE
  content.push({
    text: "BRIEF DESCRIPTION AND RATIONALE OF THE ACTIVITY OR SERVICE:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: f?.description || "—", margin: [0, 0, 0, 15] });

  // TARGET GROUP
  content.push({
    text: "TARGET GROUP AND REASONS FOR CHOOSING IT:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: f?.targetGroup || "—", margin: [0, 0, 0, 15] });

  // DATE OF IMPLEMENTATION
  content.push({
    text: "DATE OF IMPLEMENTATION:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // Date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  content.push({
    columns: [
      {
        width: '50%',
        stack: [
          { text: "A. Start Date", bold: true, margin: [0, 0, 0, 5] },
          { text: f?.startDate ? formatDate(f.startDate) : "—" }
        ]
      },
      {
        width: '50%',
        stack: [
          { text: "B. End Date", bold: true, margin: [0, 0, 0, 5] },
          { text: f?.endDate ? formatDate(f.endDate) : "—" }
        ]
      }
    ],
    margin: [0, 0, 0, 15]
  });

  // V. ACTIVITY PLAN AND BUDGET
  content.push({
    text: "V. ACTIVITY PLAN AND BUDGET:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const activityPlanBody = [
    [
      { text: "Objectives", bold: true, fontSize: 10 },
      { text: "Activities", bold: true, fontSize: 10 },
      { text: "Outputs", bold: true, fontSize: 10 },
      { text: "Personnel", bold: true, fontSize: 10 },
      { text: "Budget", bold: true, fontSize: 10 },
    ],
  ];

  if (f?.activity_plans_budgets && f.activity_plans_budgets.length > 0) {
    f.activity_plans_budgets.forEach((activity) => {
      activityPlanBody.push([
        { text: activity?.objectives || "—", fontSize: 9 },
        { text: activity?.activities || "—", fontSize: 9 },
        { text: activity?.outputs || "—", fontSize: 9 },
        { text: activity?.personnel || "—", fontSize: 9 },
        { text: activity?.budget ? `₱ ${parseFloat(activity.budget).toLocaleString()}` : "₱ 0.00", fontSize: 9 },
      ]);
    });
  } else {
    activityPlanBody.push([
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ["20%", "20%", "20%", "20%", "20%"],
      body: activityPlanBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 15],
  });

  // VI. DETAILED BUDGET
  content.push({
    text: "VI. DETAILED BUDGET:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const detailedBudgetBody = [
    [
      { text: "Budget Item", bold: true, fontSize: 10 },
      { text: "Details or Particulars", bold: true, fontSize: 10 },
      { text: "Quantity", bold: true, fontSize: 10 },
      { text: "Amount", bold: true, fontSize: 10 },
      { text: "Total", bold: true, fontSize: 10 },
    ],
  ];

  if (f?.detailed_budgets && f.detailed_budgets.length > 0) {
    f.detailed_budgets.forEach((item) => {
      detailedBudgetBody.push([
        { text: item?.item || "—", fontSize: 9 },
        { text: item?.details || "—", fontSize: 9 },
        { text: item?.quantity || "—", fontSize: 9 },
        { text: item?.amount ? `₱ ${parseFloat(item.amount).toLocaleString()}` : "₱ 0.00", fontSize: 9 },
        { text: item?.amount ? `₱ ${parseFloat(item.amount).toLocaleString()}` : "₱ 0.00", fontSize: 9 },
      ]);
    });
  } else {
    detailedBudgetBody.push([
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ["20%", "25%", "15%", "20%", "20%"],
      body: detailedBudgetBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 15],
  });

  // VII. BUDGET SOURCING
  content.push({
    text: "VII. BUDGET SOURCING:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const budgetSourcingBody = [
    [
      { text: "Counterpart of the University", bold: true, fontSize: 10 },
      { text: "Counterpart of the Outreach Group", bold: true, fontSize: 10 },
      { text: "Counterpart of the Target Group", bold: true, fontSize: 10 },
      { text: "Other Source(s) of Funding", bold: true, fontSize: 10 },
      { text: "Total", bold: true, fontSize: 10 },
    ],
  ];

  if (f?.budget_sourcings && f.budget_sourcings.length > 0) {
    f.budget_sourcings.forEach((item) => {
      budgetSourcingBody.push([
        { text: item?.university || "—", fontSize: 9 },
        { text: item?.outreachGroup || "—", fontSize: 9 },
        { text: item?.service || "—", fontSize: 9 },
        { text: item?.other || "—", fontSize: 9 },
        { text: item?.total ? `₱ ${parseFloat(item.total).toLocaleString()}` : "₱ 0.00", fontSize: 9 },
      ]);
    });
  } else {
    budgetSourcingBody.push([
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
      { text: "—", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ["20%", "20%", "20%", "20%", "20%"],
      body: budgetSourcingBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 20],
  });

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

  // CONSENT SECTION - Same as Form1 and Form2
  content.push({ 
    text: "Consent", 
    bold: true, 
    fontSize: 16, 
    margin: [0, 20, 0, 15],
    alignment: 'center'
  });

  // Use the roleId to conditionally show Dean column (roleId 2 = Dean)
  const showDeanColumn = roleId === 2;

  // First table: Conditionally show Dean and ComEx
  const firstApprovalHeaders = [];
  const firstApprovalBody = [];

  if (showDeanColumn) {
    firstApprovalHeaders.push(
      { text: 'Dean', style: 'tableHeader', alignment: 'center' },
      { text: 'ComEx', style: 'tableHeader', alignment: 'center' }
    );
    
    firstApprovalBody.push([
      // Dean cell
      {
        stack: [
          f?.dean_approved_by 
            ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
            : { text: 'Awaiting Approval', italic: true, color: 'gray' },
          f?.dean_approved_by 
            ? { 
                text: `${f?.dean_approver?.firstname || ''} ${f?.dean_approver?.lastname || ''}`.trim() || '—',
                margin: [0, 0, 0, 3]
              }
            : '',
          f?.dean_approve_date 
            ? { 
                text: new Date(f.dean_approve_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                fontSize: 9,
                color: 'gray'
              }
            : ''
        ],
        alignment: 'center',
        margin: [0, 20, 0, 0]
      },
      // ComEx cell
      {
        stack: [
          f?.commex_approved_by 
            ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
            : { text: 'Awaiting Approval', italic: true, color: 'gray' },
          f?.commex_approved_by 
            ? { 
                text: `${f?.commex_approver?.firstname || ''} ${f?.commex_approver?.lastname || ''}`.trim() || '—',
                margin: [0, 0, 0, 3]
              }
            : '',
          f?.commex_approve_date 
            ? { 
                text: new Date(f.commex_approve_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                fontSize: 9,
                color: 'gray'
              }
            : ''
        ],
        alignment: 'center',
        margin: [0, 20, 0, 0]
      }
    ]);
  } else {
    // Only ComEx column
    firstApprovalHeaders.push(
      { text: 'ComEx', style: 'tableHeader', alignment: 'center' }
    );
    
    firstApprovalBody.push([
      // ComEx cell only
      {
        stack: [
          f?.commex_approved_by 
            ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
            : { text: 'Awaiting Approval', italic: true, color: 'gray' },
          f?.commex_approved_by 
            ? { 
                text: `${f?.commex_approver?.firstname || ''} ${f?.commex_approver?.lastname || ''}`.trim() || '—',
                margin: [0, 0, 0, 3]
              }
            : '',
          f?.commex_approve_date 
            ? { 
                text: new Date(f.commex_approve_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                fontSize: 9,
                color: 'gray'
              }
            : ''
        ],
        alignment: 'center',
        margin: [0, 20, 0, 0]
      }
    ]);
  }

  const firstApprovalTable = {
    table: {
      headerRows: 1,
      widths: showDeanColumn ? ['50%', '50%'] : ['100%'],
      body: [firstApprovalHeaders, ...firstApprovalBody]
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 4; },
      paddingRight: function(i, node) { return 4; },
      paddingTop: function(i, node) { return 10; },
      paddingBottom: function(i, node) { return 10; },
    },
    margin: [0, 0, 0, 10]
  };

  content.push(firstApprovalTable);

  // Second table: ASD and AD (always show both)
  const secondApprovalTable = {
    table: {
      headerRows: 1,
      widths: ['50%', '50%'],
      body: [
        [
          { text: 'Academic Services Director', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Director', style: 'tableHeader', alignment: 'center' }
        ],
        [
          // ASD cell
          {
            stack: [
              f?.asd_approved_by 
                ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
                : { text: 'Awaiting Approval', italic: true, color: 'gray' },
              f?.asd_approved_by 
                ? { 
                    text: `${f?.asd_approver?.firstname || ''} ${f?.asd_approver?.lastname || ''}`.trim() || '—',
                    margin: [0, 0, 0, 3]
                  }
                : '',
              f?.asd_approve_date 
                ? { 
                    text: new Date(f.asd_approve_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    fontSize: 9,
                    color: 'gray'
                  }
                : ''
            ],
            alignment: 'center',
            margin: [0, 20, 0, 0]
          },
          // AD cell
          {
            stack: [
              f?.ad_approved_by 
                ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
                : { text: 'Awaiting Approval', italic: true, color: 'gray' },
              f?.ad_approved_by 
                ? { 
                    text: `${f?.ad_approver?.firstname || ''} ${f?.ad_approver?.lastname || ''}`.trim() || '—',
                    margin: [0, 0, 0, 3]
                  }
                : '',
              f?.ad_approve_date 
                ? { 
                    text: new Date(f.ad_approve_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    fontSize: 9,
                    color: 'gray'
                  }
                : ''
            ],
            alignment: 'center',
            margin: [0, 20, 0, 0]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 4; },
      paddingRight: function(i, node) { return 4; },
      paddingTop: function(i, node) { return 10; },
      paddingBottom: function(i, node) { return 10; },
    },
    margin: [0, 0, 0, 20]
  };

  content.push(secondApprovalTable);

  // RECEIVED BY SECTION - at the very bottom
  content.push({ 
    text: "Received By:", 
    bold: true, 
    fontSize: 13, 
    margin: [0, 30, 0, 10] 
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
            margin: [0, 8, 0, 8]
          }
        ],
        // Second row: Signature and Date/Time
        [
          {
            columns: [
              {
                width: '60%',
                stack: [
                  { text: ' ', margin: [0, 15, 0, 0] },
                  { text: 'Signature Over Printed Name', margin: [0, 20, 0, 5] }
                ]
              },
              {
                width: '40%',
                stack: [
                  { text: 'Date: ________________', margin: [0, 20, 0, 5] },
                  { text: 'Time: ________________', margin: [0, 15, 0, 0] }
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
            margin: [0, 8, 0, 8]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 8; },
      paddingRight: function(i, node) { return 8; },
      paddingTop: function(i, node) { return 8; },
      paddingBottom: function(i, node) { return 8; },
    },
    margin: [0, 0, 0, 20]
  };

  content.push(receivedByTable);

  const docDefinition = {
    content,
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 5, 0, 5]
      }
    },
    defaultStyle: { 
      fontSize: 11, 
      lineHeight: 1.15 
    },
    pageMargins: [40, 40, 40, 40],
  };

  pdfMake.createPdf(docDefinition).download("form3-outreach-proposal.pdf");
};
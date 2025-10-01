// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}
// utils/pdfGenerator.js - Add this function for Form9
export const downloadForm9Pdf = (form9, event, owner, roleId) => {
  console.log("downloadForm9Pdf called", { form9, event, owner, roleId });

  if (!form9) {
    console.warn("downloadForm9Pdf: no form9 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form9) ? form9[0] || {} : form9 || {};
  const form1Data = event?.form1?.[0];
  
  // Program Title and Team Data
  const programTitle = event?.eventName || "—";
  const implementer = event?.organization?.name || "—";
  const managementTeam = form1Data?.team_members || [];
  const targetGroup = event?.target_group || "—";

  // Executive Summary Data from form9
  const logicModels = f?.logic_models || [];
  const findingsDiscussion = f?.findings_discussion || "—";
  const conclusionRecommendations = f?.conclusion_recommendations || "—";

  // Get team leader from user data
  const teamLeader = event?.user ? `${event.user.firstname} ${event.user.middlename} ${event.user.lastname}` : "—";

  const content = [];

  // Main Title
  content.push({
    text: "EXTENSION PROGRAM EVALUATION AND TERMINAL REPORT",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

  // I. PROGRAM TITLE
  content.push({
    text: "I. PROGRAM TITLE:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: programTitle, margin: [0, 0, 0, 15] });

  // A. Implementer
  content.push({ 
    text: "A. Implementer", 
    bold: true, 
    margin: [0, 5, 0, 5] 
  });
  content.push({ 
    text: implementer, 
    margin: [20, 0, 0, 10] 
  });

  // B. Extension Program Management Team
  content.push({ 
    text: "B. Extension Program Management Team", 
    bold: true, 
    margin: [0, 5, 0, 5] 
  });

  // 1. Program Coordinator
  content.push({ 
    text: "1. Program Coordinator", 
    bold: true, 
    margin: [20, 5, 0, 5] 
  });
  content.push({ 
    text: teamLeader, 
    margin: [40, 0, 0, 10] 
  });

  // 2. Team Members
  content.push({ 
    text: "2. Team Members", 
    bold: true, 
    margin: [20, 5, 0, 5] 
  });
  
  if (managementTeam.length > 0) {
    managementTeam.forEach((member) => {
      content.push({ 
        text: `• ${member.name || "—"}`, 
        margin: [40, 2, 0, 2] 
      });
    });
  } else {
    content.push({ 
      text: "No management team members specified", 
      margin: [40, 0, 0, 10] 
    });
  }

  // C. Target Group
  content.push({ 
    text: "C. Target Group", 
    bold: true, 
    margin: [0, 15, 0, 5] 
  });
  content.push({ 
    text: targetGroup, 
    margin: [20, 0, 0, 15] 
  });

  // II. EXECUTIVE SUMMARY
  content.push({
    text: "II. EXECUTIVE SUMMARY:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Program Logic Model
  content.push({ 
    text: "A. Program Logic Model", 
    bold: true, 
    margin: [0, 10, 0, 10] 
  });

  const logicModelBody = [
    [
      { text: "Objectives", bold: true, fontSize: 10 },
      { text: "Inputs", bold: true, fontSize: 10 },
      { text: "Activities", bold: true, fontSize: 10 },
      { text: "Outputs", bold: true, fontSize: 10 },
      { text: "Outcomes", bold: true, fontSize: 10 },
    ],
  ];

  if (logicModels.length > 0) {
    logicModels.forEach((item) => {
      logicModelBody.push([
        { text: item?.objectives || "—", fontSize: 9 },
        { text: item?.inputs || "—", fontSize: 9 },
        { text: item?.activities || "—", fontSize: 9 },
        { text: item?.outputs || "—", fontSize: 9 },
        { text: item?.outcomes || "—", fontSize: 9 },
      ]);
    });
  } else {
    logicModelBody.push([
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
      body: logicModelBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 15],
  });

  // B. Findings and Discussion
  content.push({ 
    text: "B. Findings and Discussion", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: findingsDiscussion, 
    margin: [0, 0, 0, 15] 
  });

  // C. Conclusion and Recommendations
  content.push({ 
    text: "C. Conclusion and Recommendations", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: conclusionRecommendations, 
    margin: [0, 0, 0, 20] 
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

  // CONSENT SECTION - Same as Form2 and Form3
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
                  { text: 'Signature Over Printed Name', margin: [0, 20, 0, 5] },
                  { text: ' ', margin: [0, 15, 0, 0] }
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

  pdfMake.createPdf(docDefinition).download("form9-evaluation-terminal-report.pdf");
};
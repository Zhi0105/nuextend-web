// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

// utils/pdfGenerator.js - Add this function for Form10
export const downloadForm10Pdf = (form10, event, owner, roleId) => {
  console.log("downloadForm10Pdf called", { form10, event, owner, roleId });

  if (!form10) {
    console.warn("downloadForm10Pdf: no form10 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form10) ? form10[0] || {} : form10 || {};
  const form7Data = event?.form7?.[0];
  
  // Project data from event
  const projectTitle = event?.eventName || "—";
  const targetGroup = event?.target_group || "—";
  const implementationDate = form7Data?.conducted_on || "—";

  // Form10 specific data
  const aoopData = f?.oaopb || []; // Objectives, Activities, Outputs, Personnel data
  const discussion = f?.discussion || "—";

  const content = [];

  // Main Title
  content.push({
    text: "OUTREACH PROJECT EVALUATION AND DOCUMENTATION REPORT",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

  // I. PROJECT TITLE
  content.push({
    text: "I. PROJECT TITLE:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: projectTitle, margin: [0, 0, 0, 15] });

  // II. TARGET GROUP
  content.push({
    text: "II. TARGET GROUP:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: targetGroup, margin: [0, 0, 0, 5] });

  // III. DATE OF IMPLEMENTATION
  content.push({
    text: "III. DATE OF IMPLEMENTATION:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: implementationDate, margin: [0, 0, 0, 15] });

  // IV. REPORT PROPER
  content.push({
    text: "IV. REPORT PROPER:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Objectives, Activities, Outputs, Personnels and Budgeting
  content.push({ 
    text: "A. Objectives, Activities, Outputs, Personnels and Budgeting", 
    bold: true, 
    margin: [0, 10, 0, 10] 
  });

  const aoopBody = [
    [
      { text: "Objectives", bold: true, fontSize: 10 },
      { text: "Activities", bold: true, fontSize: 10 },
      { text: "Outputs", bold: true, fontSize: 10 },
      { text: "Personnel", bold: true, fontSize: 10 },
      { text: "Budget", bold: true, fontSize: 10 },
    ],
  ];

  if (aoopData.length > 0) {
    aoopData.forEach((item) => {
      aoopBody.push([
        { text: item?.objectives || "—", fontSize: 9 },
        { text: item?.activities || "—", fontSize: 9 },
        { text: item?.outputs || "—", fontSize: 9 },
        { text: item?.personnel || "—", fontSize: 9 },
        { text: item?.budget || "—", fontSize: 9 },
      ]);
    });
  } else {
    aoopBody.push([
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
      body: aoopBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 10],
  });

  content.push({
    text: "Important Note: Filling out this matrix with accurate data will be helpful.",
    italics: true,
    fontSize: 10,
    color: 'gray',
    margin: [0, 0, 0, 15]
  });

  // B. Discussion
  content.push({ 
    text: "B. Discussion", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: discussion, 
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

  // CONSENT SECTION - Same as Form9
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

  pdfMake.createPdf(docDefinition).download("form10-outreach-evaluation-report.pdf");
};
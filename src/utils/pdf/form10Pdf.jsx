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

  pdfMake.createPdf(docDefinition).download("form10-outreach-evaluation-report.pdf");
};
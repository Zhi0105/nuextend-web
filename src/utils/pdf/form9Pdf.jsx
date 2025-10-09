import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

function getBase64ImageFromURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
}

// utils/pdfGenerator.js - Add this function for Form9
export const downloadForm9Pdf = async (form9, event, owner, roleId) => {
  console.log("downloadForm9Pdf called", { form9, event, owner, roleId });
  const logo = await getBase64ImageFromURL('/LogoHeader.png');

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

  const headerContent = [{
      columns: [
        // Image on the left
        {
          width: 'auto',
          image: logo,
          width: 250,
          margin: [20, -20, 0, 0]
        },
        // Text on the right
        {
          width: '*',
          stack: [
            {
              text: 'Extension Program Evaluation',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: 'and Terminal Report Format',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: 'NUB – ACD – CMX – F – 009',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: '2025',
              fontSize: 10,
              bold: true
            }
          ],
          alignment: 'right'
        }
      ],
      margin: [0, 20, 30, 0]
    },
  ];

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
              text: roleId === 4 ? "☒ Faculty Member" : "☒ Student", 
              margin: [0, 0, 20, 0] 
            }
          ]
        },
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
    header: headerContent, // This will appear on every page
    content: content,
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
    pageMargins: [40, 80, 40, 40], // Increased top margin to accommodate header
  };

  pdfMake.createPdf(docDefinition).download("form9-evaluation-terminal-report.pdf");
};
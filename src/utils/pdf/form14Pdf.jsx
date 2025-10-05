export const downloadForm14Pdf = (form14, event, owner, roleId, approvalData) => {
  console.log("downloadForm14Pdf called", { form14, event, owner, roleId, approvalData });

  if (!form14) {
    console.warn("downloadForm14Pdf: no form14 provided");
    return;
  }

  // Use approvalData for the consent section, fallback to form14 if not provided
  const consentData = approvalData || form14;
  console.log("📍 Consent data for PDF:", consentData);

  // Extract data from form14
  const objectives = form14?.objectives || "—";
  const targetGroup = form14?.target_group || "—";
  const description = form14?.description || "—";
  const achievements = form14?.achievements || "—";
  const challenges = form14?.challenges || "—";
  const feedback = form14?.feedback || "—";
  const acknowledgements = form14?.acknowledgements || "—";
  const budgetSummaries = form14?.budget_summaries || [];

  // Get project title and date from event data
  const projectTitle = event?.eventName || event?.name || "—";
  const reportDate = form14?.updated_at ? new Date(form14.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : "—";

  // Get school/department from owner data
  const schoolName = owner?.department?.name || "—";
  const departmentName = owner?.program?.name || "—";

  // Helper function to create approval cell with LARGE e-signatures (from Form12 reference)
  const createApprovalCell = (approved, approver, approveDate, title) => {
    const isApproved = !!approved;
    const approverName = approver ? `${approver.firstname || ''} ${approver.lastname || ''}`.trim() : '';
    const signatureBase64 = approver?.esign;
    
    const cellContent = [];

    // Add signature image - LARGE but with minimal spacing
    if (isApproved && signatureBase64) {
      cellContent.push({
        image: signatureBase64,
        width: 220,  // Large signature
        height: 100,  // Large signature
        alignment: 'center',
        margin: [0, -20, 0, -20] // Minimal margin below signature
      });
    } else if (isApproved) {
      cellContent.push({
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 140, y2: 0, // Long line
            lineWidth: 1,
            lineColor: 'black'
          }
        ],
        margin: [0, 8, 0, 2]
      });
    } else {
      cellContent.push({
        text: ' ',
        margin: [0, 8, 0, 2]
      });
    }

    // Status below signature - very compact
    cellContent.push({
      text: isApproved ? 'Approved' : 'Awaiting Approval',
      bold: isApproved,
      color: isApproved ? 'green' : 'gray',
      italic: !isApproved,
      alignment: 'center',
      margin: [0, 0, 0, 1], // Minimal margin
      fontSize: 9
    });

    // Approver name - CAPITAL LETTERS and compact
    cellContent.push({
      text: approverName ? approverName.toUpperCase() : (isApproved ? '—' : '___________________'),
      alignment: 'center',
      margin: [0, 0, 0, 1], // Minimal margin
      fontSize: 10,
      bold: true
    });

    // Title - very compact
    cellContent.push({
      text: title,
      alignment: 'center',
      fontSize: 8,
      color: 'gray',
      margin: [0, 0, 0, 1] // Minimal margin
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
      margin: [0, 2, 0, 2] // Very compact margins around entire cell
    };
  };

  // Helper function to create Prepared By cell WITH E-SIGNATURE
  const createPreparedByCell = (owner) => {
    const coordinatorFirstName = owner?.firstname || "";
    const coordinatorMiddleName = owner?.middlename || "";
    const coordinatorLastName = owner?.lastname || "";
    const coordinatorFullName = `${coordinatorFirstName} ${coordinatorMiddleName} ${coordinatorLastName}`.trim();
    const signatureBase64 = owner?.esign;
    
    const cellContent = [];

    // Add signature image for Prepared By
    if (signatureBase64) {
      cellContent.push({
        image: signatureBase64,
        width: 220,  // Same size as other signatures
        height: 100,  // Same size as other signatures
        alignment: 'center',
        margin: [0, -7, 0, -20] // Minimal margin below signature
      });
    } else {
      cellContent.push({
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 140, y2: 0, // Same line length as other signatures
            lineWidth: 1,
            lineColor: 'black'
          }
        ],
        margin: [0, 8, 0, 2]
      });
    }

    // Name - CAPITAL LETTERS
    cellContent.push({
      text: coordinatorFullName ? coordinatorFullName.toUpperCase() : '___________________',
      alignment: 'center',
      bold: true,
      fontSize: 10,
      margin: [0, 0, 0, 1]
    });

    // Title
    cellContent.push({
      text: 'Program Coordinator',
      alignment: 'center',
      fontSize: 8,
      color: 'gray',
      margin: [0, 0, 0, 0]
    });

    return {
      stack: cellContent,
      alignment: 'center',
      margin: [0, 2, 0, 2] // Same margins as other cells
    };
  };

  const content = [];

  // HEADER SECTION - Project Title, School, Department, and Date
  content.push({
    columns: [
      {
        width: '70%',
        stack: [
          { text: "POST-ACTIVITY REPORT", bold: true, fontSize: 16, margin: [0, 0, 0, 5] },
          { text: `Project Title: ${projectTitle}`, fontSize: 11, margin: [0, 0, 0, 3] },
          { text: `School: ${schoolName}`, fontSize: 11, margin: [0, 0, 0, 3] },
          { text: `Department: ${departmentName}`, fontSize: 11, margin: [0, 0, 0, 3] },
        ]
      },
      {
        width: '30%',
        stack: [
          { text: `Date: ${reportDate}`, fontSize: 11, alignment: 'right', margin: [0, 0, 0, 3] },
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  });

  // Separator line
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
    margin: [0, 0, 0, 20]
  });

  // Main Content continues with your existing sections...
  content.push({
    text: "PROGRAM DETAILS",
    bold: true,
    fontSize: 14,
    margin: [0, 0, 0, 15],
  });

  // Objectives
  content.push({
    text: "Objectives:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: objectives, 
    margin: [0, 0, 0, 15] 
  });

  // Target Group
  content.push({
    text: "Target Group:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: targetGroup, 
    margin: [0, 0, 0, 15] 
  });

  content.push({
    text: "Description:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: description, 
    margin: [0, 0, 0, 15] 
  });

  // Achievements
  content.push({
    text: "Achievements:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: achievements, 
    margin: [0, 0, 0, 15] 
  });

  // Challenges
  content.push({
    text: "Challenges:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: challenges, 
    margin: [0, 0, 0, 15] 
  });

  // Feedback
  content.push({
    text: "Feedback:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: feedback, 
    margin: [0, 0, 0, 15] 
  });

  // Acknowledgements
  content.push({
    text: "Acknowledgements:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: acknowledgements, 
    margin: [0, 0, 0, 15] 
  });

  // Budget Summaries (your existing budget table code)
  content.push({
    text: "Budget Summaries:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const budgetBody = [
    [
      { text: "Description", bold: true, fontSize: 10 },
      { text: "Item", bold: true, fontSize: 10 },
      { text: "Personnel", bold: true, fontSize: 10 },
      { text: "Quantity", bold: true, fontSize: 10 },
      { text: "Cost", bold: true, fontSize: 10 },
    ],
  ];

  if (budgetSummaries.length > 0) {
    budgetSummaries.forEach((budget) => {
      budgetBody.push([
        { text: budget?.description || "—", fontSize: 9 },
        { text: budget?.item || "—", fontSize: 9 },
        { text: budget?.personnel || "—", fontSize: 9 },
        { text: budget?.quantity || "—", fontSize: 9 },
        { text: budget?.cost ? `₱ ${Number(budget.cost).toLocaleString()}` : "₱ 0.00", fontSize: 9 },
      ]);
    });

    // Add total row
    const totalBudget = budgetSummaries.reduce((sum, budget) => sum + Number(budget.cost || 0), 0);
    budgetBody.push([
      { text: "Total Budget", bold: true, fontSize: 9, colSpan: 4, alignment: 'right' },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: `₱ ${totalBudget.toLocaleString()}`, bold: true, fontSize: 9 },
    ]);
  } else {
    budgetBody.push([
      { text: "—", fontSize: 9, colSpan: 5, alignment: 'center' },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ['25%', '20%', '20%', '15%', '20%'],
      body: budgetBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 20],
  });

  content.push({
    text: '',
    pageBreak: 'after'
  });

  // MERGED APPROVAL TABLE - Prepared By, ComEx, and ASD with E-SIGNATURES
  content.push({ 
    text: "APPROVALS", 
    bold: true, 
    fontSize: 16, 
    margin: [0, 20, 0, 15],
    alignment: 'center'
  });

  const mergedApprovalTable = {
    table: {
      headerRows: 1,
      widths: ['33%', '33%', '34%'],
      body: [
        [
          { text: 'Prepared By:', style: 'tableHeader', alignment: 'center' },
          { text: 'Reviewed By:', style: 'tableHeader', alignment: 'center' },
          { text: 'Noted By:', style: 'tableHeader', alignment: 'center' }
        ],
        [
          // Prepared By cell WITH E-SIGNATURE
          createPreparedByCell(owner),
          // ComEx cell WITH E-SIGNATURE
          createApprovalCell(
            consentData?.is_commex,
            consentData?.commex_approver,
            consentData?.commex_approve_date,
            'ComEx Coordinator'
          ),
          // ASD cell WITH E-SIGNATURE
          createApprovalCell(
            consentData?.is_asd,
            consentData?.asd_approver,
            consentData?.asd_approve_date,
            'Academic Services Director'
          )
        ]
      ],
      heights: [15, 80] // Compact fixed heights
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

  const docDefinition = {
    content,
    styles: {
      tableHeader: {
        fontSize: 10,
        bold: true,
        margin: [0, 3, 0, 3]
      }
    },
    defaultStyle: { 
      fontSize: 11, 
      lineHeight: 1.15 
    },
    pageMargins: [40, 40, 40, 40],
  };

  pdfMake.createPdf(docDefinition).download("form14-progress-report.pdf");
};
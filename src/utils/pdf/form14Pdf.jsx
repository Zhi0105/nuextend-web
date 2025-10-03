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

  // PREPARED BY SECTION
  content.push({ 
    text: "Prepared By:", 
    bold: true, 
    fontSize: 13, 
    margin: [0, 20, 0, 10] 
  });

  // Get coordinator details from owner
  const coordinatorFirstName = owner?.firstname || "";
  const coordinatorMiddleName = owner?.middlename || "";
  const coordinatorLastName = owner?.lastname || "";
  const coordinatorFullName = `${coordinatorFirstName} ${coordinatorMiddleName} ${coordinatorLastName}`.trim();

  // Report Coordinator details
  content.push({
    stack: [
      { 
        text: coordinatorFullName || "—",
        margin: [0, 0, 0, 5]
      }
    ],
    margin: [0, 0, 0, 20]
  });

  // CONSENT SECTION - Only ComEx and ASD (your existing consent table code)
  content.push({ 
    text: "Consent", 
    bold: true, 
    fontSize: 16, 
    margin: [0, 20, 0, 15],
    alignment: 'center'
  });

  // Single table with ComEx and ASD only
  const consentTable = {
    table: {
      headerRows: 1,
      widths: ['50%', '50%'],
      body: [
        [
          { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Services Director', style: 'tableHeader', alignment: 'center' }
        ],
        [
          // ComEx cell
          {
            stack: [
              consentData?.is_commex 
                ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
                : { text: 'Awaiting Approval', italic: true, color: 'gray' },
              consentData?.is_commex 
                ? { 
                    text: `${consentData?.commex_approver?.firstname || ''} ${consentData?.commex_approver?.lastname || ''}`.trim() || '—',
                    margin: [0, 0, 0, 3]
                  }
                : '',
              consentData?.commex_approve_date 
                ? { 
                    text: new Date(consentData.commex_approve_date).toLocaleDateString('en-US', {
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
          // ASD cell
          {
            stack: [
              consentData?.is_asd 
                ? { text: 'Approved', bold: true, color: 'green', margin: [0, 0, 0, 5] }
                : { text: 'Awaiting Approval', italic: true, color: 'gray' },
              consentData?.is_asd 
                ? { 
                    text: `${consentData?.asd_approver?.firstname || ''} ${consentData?.asd_approver?.lastname || ''}`.trim() || '—',
                    margin: [0, 0, 0, 3]
                  }
                : '',
              consentData?.asd_approve_date 
                ? { 
                    text: new Date(consentData.asd_approve_date).toLocaleDateString('en-US', {
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

  content.push(consentTable);

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

  pdfMake.createPdf(docDefinition).download("form14-progress-report.pdf");
};
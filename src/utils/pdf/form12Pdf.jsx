// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

// utils/pdfGenerator.js - Add this function for Form12
export const downloadForm12Pdf = (form12, event, owner, roleId) => {
  console.log("downloadForm12Pdf called", { form12, event, owner, roleId });

  if (!form12) {
    console.warn("downloadForm12Pdf: no form12 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form12) ? form12[0] || {} : form12 || {};
  
  // Extract data from form12
  const attenders = f?.attendees || []; 
  const callToOrder = f?.call_to_order || "—";
  const approvalMinutes = f?.aomftlm || "—";
  const newItems = f?.new_items || [];
  const otherMatters = f?.other_matters || "—";
  const adjournment = f?.adjournment;
  const documentation = f?.documentation || "—";

  const content = [];

  // Main Title
  content.push({
    text: "MEETING MINUTES",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

  // I. ATTENDERS
  content.push({
    text: "I. ATTENDERS:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const attendersBody = [
    [
      { text: "A", bold: true, fontSize: 10 },
      { text: "Full Name", bold: true, fontSize: 10 },
      { text: "Designation", bold: true, fontSize: 10 },
      { text: "School/Department", bold: true, fontSize: 10 },
    ],
  ];

  if (attenders.length > 0) {
    attenders.forEach((attender, index) => {
      attendersBody.push([
        { text: (index + 1).toString(), fontSize: 9 },
        { text: attender?.full_name || "—", fontSize: 9 },
        { text: attender?.designation || "—", fontSize: 9 },
        {text: `${attender?.department?.name || ""}${attender?.program?.name ? " - " + attender.program.name : ""}` || "—",fontSize: 9}
      ]);
    });
  } else {
    attendersBody.push([
      { text: "—", fontSize: 9, colSpan: 4, alignment: 'center' },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ['8%', '32%', '30%', '30%'],
      body: attendersBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 15],
  });

  // II. CALL TO ORDER
  content.push({
    text: "II. CALL TO ORDER:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: callToOrder, 
    margin: [0, 0, 0, 15] 
  });

  // III. APPROVAL OF MINUTES FROM THE LAST MEETING
  content.push({
    text: "III. APPROVAL OF MINUTES FROM THE LAST MEETING:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: approvalMinutes, 
    margin: [0, 0, 0, 15] 
  });

  // IV. NEW ITEMS
  content.push({
    text: "IV. NEW ITEMS:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  const newItemsBody = [
    [
      { text: "A", bold: true, fontSize: 10 },
      { text: "Topic", bold: true, fontSize: 10 },
      { text: "Discussion", bold: true, fontSize: 10 },
      { text: "Resolution", bold: true, fontSize: 10 },
    ],
  ];

  if (newItems.length > 0) {
    newItems.forEach((item, index) => {
      newItemsBody.push([
        { text: (index + 1).toString(), fontSize: 9 },
        { text: item?.topic || "—", fontSize: 9 },
        { text: item?.discussion || "—", fontSize: 9 },
        { text: item?.resolution || "—", fontSize: 9 },
      ]);
    });
  } else {
    newItemsBody.push([
      { text: "—", fontSize: 9, colSpan: 4, alignment: 'center' },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ['8%', '27%', '32%', '33%'],
      body: newItemsBody,
    },
    layout: { dontBreakRows: true, keepWithHeaderRows: 1 },
    margin: [0, 0, 0, 15],
  });

  // V. OTHER MATTERS
  content.push({
    text: "V. OTHER MATTERS:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: otherMatters, 
    margin: [0, 0, 0, 15] 
  });

  // VI. ADJOURNMENT
  content.push({
    text: "VI. ADJOURNMENT:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  const adjournmentText = adjournment
  ? `The meeting adjourned at exactly ${new Date(adjournment).toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })}.`
  : "The meeting adjourned at exactly ______.";

  content.push({ 
    text: adjournmentText, 
    margin: [0, 0, 0, 15] 
  });

  // VII. DOCUMENTATION
  content.push({
    text: "VII. DOCUMENTATION:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ 
    text: documentation, 
    margin: [0, 0, 0, 20] 
  });

  // Helper function to create approval cell with e-signatures (from Form11 reference)
  const createApprovalCell = (approved, approver, approveDate, title) => {
    const isApproved = !!approved;
    const approverName = approver ? `${approver.firstname || ''} ${approver.lastname || ''}`.trim() : '';
    const signatureBase64 = approver?.esign;
    
    const cellContent = [];

    // Add signature image
    if (isApproved && signatureBase64) {
      cellContent.push({
        image: signatureBase64,
        width: 220,
        height: 100,
        alignment: 'center',
        margin: [0, -20, 0, -20]
      });
    } else if (isApproved) {
      cellContent.push({
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 120, y2: 0,
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

    // Status
    cellContent.push({
      text: isApproved ? 'Approved' : 'Awaiting Approval',
      bold: isApproved,
      color: isApproved ? 'green' : 'gray',
      italic: !isApproved,
      alignment: 'center',
      margin: [0, 0, 0, 1],
      fontSize: 9
    });

    // Approver name
    cellContent.push({
      text: approverName ? approverName.toUpperCase() : (isApproved ? '—' : '___________________'),
      alignment: 'center',
      margin: [0, 0, 0, 1],
      fontSize: 9,
      bold: true
    });

    // Title
    cellContent.push({
      text: title,
      alignment: 'center',
      fontSize: 8,
      color: 'gray',
      margin: [0, 0, 0, 1]
    });

    // Date
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
        margin: [0, 0, 0, 0]
      });
    } else {
      cellContent.push({
        text: 'Date: ______________',
        alignment: 'center',
        fontSize: 8,
        color: 'gray',
        margin: [0, 0, 0, 0]
      });
    }

    return {
      stack: cellContent,
      alignment: 'center',
      margin: [0, 2, 0, 2]
    };
  };

  // Helper function to create Meeting Scribe cell (no e-signature, just line)
  const createMeetingScribeCell = () => {
    const cellContent = [];

    // Name placeholder
    cellContent.push({
      text: 'Signature Over Printed Name',
      alignment: 'center',
      margin: [0, 75, 0, 1],
      fontSize: 9,
      bold: true
    });

    // Title
    cellContent.push({
      text: 'Meeting Scribe',
      alignment: 'center',
      fontSize: 8,
      color: 'gray',
      margin: [0, 0, 0, 0]
    });

    return {
      stack: cellContent,
      alignment: 'center',
      margin: [0, 2, 0, 2]
    };
  };

  // MERGED APPROVAL TABLE - Meeting Scribe, ComEx, and ASD
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
          // Meeting Scribe cell (Prepared By)
          createMeetingScribeCell(),
          // ComEx cell (Reviewed By)
          createApprovalCell(
            f?.commex_approved_by,
            f?.commex_approver,
            f?.commex_approve_date,
            'ComEx Coordinator'
          ),
          // ASD cell (Noted By)
          createApprovalCell(
            f?.asd_approved_by,
            f?.asd_approver,
            f?.asd_approve_date,
            'Academic Services Director'
          )
        ]
      ],
      heights: [15, 80]
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
    margin: [0, 0, 0, 0]
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

  pdfMake.createPdf(docDefinition).download("form12-meeting-minutes.pdf");
};
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

  // CONSENT SECTION - Only ComEx and ASD
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
          },
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

      content.push({
    stack: [
      { 
        text: "____________________",
        margin: [0, 0, 0, 5]
      }
    ],
    margin: [0, 0, 0, 0]
  });

  content.push({
    stack: [
      { 
        text: "Meeting Scribe",
        margin: [0, 0, 0, 5]
      }
    ],
    margin: [0, 0, 0, 20]
  });

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

  pdfMake.createPdf(docDefinition).download("form12-meeting-minutes.pdf");
};
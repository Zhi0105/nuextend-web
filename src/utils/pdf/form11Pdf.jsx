// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

// utils/pdfGenerator.js - Add this function for Form11
export const downloadForm11Pdf = (form11, event, owner, roleId) => {
  console.log("downloadForm11Pdf called", { form11, event, owner, roleId });

  if (!form11) {
    console.warn("downloadForm11Pdf: no form11 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form11) ? form11[0] || {} : form11 || {};
  
  // Extract data from form11 and event
  const programCoordinator = event?.user ? `${event.user.firstname} ${event.user.middlename} ${event.user.lastname}` : "—";
  const transportationMedium = f?.transportation_medium || "—";
  const driver = f?.driver || "—";
  const travelDetails = f?.travel_details || [];

  const content = [];

  // Main Title
  content.push({
    text: "EXTENSION PROGRAM AND PROJECT ITINERARY OF TRAVEL",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

  // Header Info
  content.push({
    columns: [
      {
        width: '33%',
        stack: [
          { text: "Program Coordinator / Project Leader", bold: true, margin: [0, 0, 0, 5] },
          { text: programCoordinator }
        ]
      },
      {
        width: '33%',
        stack: [
          { text: "Transportation Medium", bold: true, margin: [0, 0, 0, 5] },
          { text: transportationMedium }
        ]
      },
      {
        width: '33%',
        stack: [
          { text: "Driver", bold: true, margin: [0, 0, 0, 5] },
          { text: driver }
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  });

  // Travel Details Table
  const travelDetailsBody = [
    [
      { text: "Date and Phase", bold: true, fontSize: 9, colSpan: 1 },
      { text: "", bold: true, fontSize: 9 }, // Placeholder for colspan
      { text: "Destination", bold: true, fontSize: 9, colSpan: 2 },
      { text: "", bold: true, fontSize: 9 }, // Placeholder for colspan
      { text: "Time", bold: true, fontSize: 9, colSpan: 2 },
      { text: "", bold: true, fontSize: 9 }, // Placeholder for colspan
      { text: "Trip Duration", bold: true, fontSize: 9 },
      { text: "Purpose", bold: true, fontSize: 9 }
    ],
    [
      { text: "", fontSize: 8 },
      { text: "From", bold: true, fontSize: 8 },
      { text: "To", bold: true, fontSize: 8 },
      { text: "Departure", bold: true, fontSize: 8 },
      { text: "Arrival", bold: true, fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 }
    ]
  ];

  if (travelDetails.length > 0) {
    travelDetails.forEach((detail) => {
      travelDetailsBody.push([
        { 
          text: detail?.date ? new Date(detail.date).toLocaleDateString() : "—", 
          fontSize: 8 
        },
        { text: detail?.from || "—", fontSize: 8 },
        { text: detail?.to || "—", fontSize: 8 },
        { 
          text: detail?.departure ? new Date(detail.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—", 
          fontSize: 8 
        },
        { 
          text: detail?.arrival ? new Date(detail.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—", 
          fontSize: 8 
        },
        { text: "", fontSize: 8 }, // Empty cell for alignment
        { text: detail?.trip_duration || "—", fontSize: 8 },
        { text: detail?.purpose || "—", fontSize: 8 }
      ]);
    });
  } else {
    travelDetailsBody.push([
      { text: "—", fontSize: 8, colSpan: 8, alignment: 'center' },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 },
      { text: "", fontSize: 8 }
    ]);
  }

  content.push({
    table: {
      headerRows: 2,
      widths: ['15%', '15%', '15%', '12%', '12%', '3%', '13%', '15%'],
      body: travelDetailsBody,
    },
    layout: {
      hLineWidth: function(i, node) { return 1; },
      vLineWidth: function(i, node) { return 1; },
      hLineColor: function(i, node) { return 'black'; },
      vLineColor: function(i, node) { return 'black'; },
      paddingLeft: function(i, node) { return 2; },
      paddingRight: function(i, node) { return 2; },
      paddingTop: function(i, node) { return 2; },
      paddingBottom: function(i, node) { return 2; },
    },
    margin: [0, 0, 0, 20]
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

  // Program Coordinator / Project Leader details
   content.push({
    stack: [
      { 
        text: coordinatorFullName || "—",
        margin: [0, 0, 0, 5]
      }
    ],
    margin: [0, 0, 0, 0]
  });

  content.push({
    stack: [
      { 
        text: "Program Coordinator / Project Leader",
        margin: [0, 0, 0, 0]
      }
    ],
    margin: [0, 0, 0, 0]
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
    pageOrientation: 'landscape' // Use landscape for better table display
  };

  pdfMake.createPdf(docDefinition).download("form11-travel-itinerary.pdf");
};
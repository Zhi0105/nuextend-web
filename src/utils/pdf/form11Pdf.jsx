// utils/pdfGenerator.js
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

// utils/pdfGenerator.js - Add this function for Form11
export const downloadForm11Pdf = async (form11, event, owner, roleId) => {
  console.log("downloadForm11Pdf called", { form11, event, owner, roleId });
  const logo = await getBase64ImageFromURL('/LogoHeader.png');

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
              text: 'Extension Program and Project',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: 'Itinerary of Travel Format',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: 'NUB – ACD – CMX – F – 011',
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

  // Helper function to create approval cell with LARGE e-signatures
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

  // Helper function to create prepared by cell WITH E-SIGNATURE
  const createPreparedByCell = (name, title, owner) => {
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
      text: name ? name.toUpperCase() : '___________________',
      alignment: 'center',
      bold: true,
      fontSize: 10,
      margin: [0, 0, 0, 1]
    });

    // Title
    cellContent.push({
      text: title,
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

  // Get coordinator details from owner
  const coordinatorFirstName = owner?.firstname || "";
  const coordinatorMiddleName = owner?.middlename || "";
  const coordinatorLastName = owner?.lastname || "";
  const coordinatorFullName = `${coordinatorFirstName} ${coordinatorMiddleName} ${coordinatorLastName}`.trim();

  // MERGED APPROVAL TABLE - ComEx, ASD, and Prepared By
  const mergedApprovalTable = {
    table: {
      headerRows: 1,
      widths: ['33%', '33%', '34%'], // Three columns: ComEx, ASD, and Prepared By
      body: [
        [
          { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
          { text: 'Academic Services Director', style: 'tableHeader', alignment: 'center' },
          { text: 'Prepared By', style: 'tableHeader', alignment: 'center' }
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
          // Prepared By cell WITH E-SIGNATURE
          createPreparedByCell(coordinatorFullName, 'Program Coordinator / Project Leader', owner)
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
    margin: [0, 0, 0, 0]
  };

  content.push(mergedApprovalTable);

  const docDefinition = {
    header: headerContent, // This will appear on every page
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
    pageMargins: [40, 80, 40, 40], // Increased top margin to accommodate header
    pageOrientation: 'landscape' // Use landscape for better table display
  };

  pdfMake.createPdf(docDefinition).download("form11-travel-itinerary.pdf");
};
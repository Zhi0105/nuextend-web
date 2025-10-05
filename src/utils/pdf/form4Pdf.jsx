// utils/pdfGenerator.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const downloadForm4Pdf = (formData, checklist, roleId, owner) => {
  // Get program coordinator name
  const coordinatorName = owner ? 
    `${owner.firstname} ${owner.middlename || ''} ${owner.lastname}`.trim() : 
    '___________________';

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to check if criteria is checked
  const isChecked = (key) => {
    const v = formData?.[key];
    return v === true || v === "true" || v === 1 || v === "1";
  };

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
        text: formatDate(approveDate),
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

  // Helper function to create assessed by cell WITH E-SIGNATURE
  const createAssessedByCell = (name, title, owner) => {
    const signatureBase64 = owner?.esign;
    
    const cellContent = [];

    // Add signature image for Assessed By
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

  // Checklist table rows
  const checklistRows = [
    // Header row
    [
      { text: 'Criteria', style: 'tableHeader', bold: true },
      { text: 'Yes', style: 'tableHeader', bold: true, alignment: 'center' },
      { text: 'No', style: 'tableHeader', bold: true, alignment: 'center' }
    ],
    
    // Categories and criteria...
    [{ text: 'I. Relevance to Academic and Research Programs', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['a', 'b', 'c'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    [{ text: 'II. Collaborative and Participatory', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['d', 'e', 'f', 'g'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    [{ text: 'III. Values Oriented', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['h'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    [{ text: 'IV. Financing and Sustainability', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['i', 'j', 'k', 'l', 'm'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    [{ text: 'V. Evidence-Based Need and Significance', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['n', 'o', 'p'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ])
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // Title
      {
        text: 'CHECKLIST OF CRITERIA FOR EXTENSION PROGRAM PROPOSAL',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 15]
      },
      
      // Checklist Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: checklistRows
        },
        layout: {
          hLineWidth: function(i, node) { return 1; },
          vLineWidth: function(i, node) { return 1; },
          hLineColor: function(i, node) { return 'black'; },
          vLineColor: function(i, node) { return 'black'; },
        },
        margin: [0, 0, 0, 0]
      },
      
      // MERGED APPROVAL TABLE WITH ASSESSED BY
      {
        table: {
          headerRows: 1,
          widths: ['33%', '33%', '34%'], // Three columns: ComEx, ASD/Dean, Assessed By
          body: [
            [
              { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
              { text: [1, 4].includes(roleId) ? 'Academic Services Director' : 'Dean', style: 'tableHeader', alignment: 'center' },
              { text: 'Assessed By', style: 'tableHeader', alignment: 'center' }
            ],
            [
              // ComEx cell
              createApprovalCell(
                formData?.commex_approved_by,
                formData?.commex_approver,
                formData?.commex_approve_date,
                'ComEx Coordinator'
              ),
              // ASD/Dean cell
              createApprovalCell(
                [1, 4].includes(roleId) ? formData?.asd_approved_by : formData?.dean_approved_by,
                [1, 4].includes(roleId) ? formData?.asd_approver : formData?.dean_approver,
                [1, 4].includes(roleId) ? formData?.asd_approve_date : formData?.dean_approve_date,
                [1, 4].includes(roleId) ? 'Academic Services Director' : 'Dean'
              ),
              // Assessed By cell WITH E-SIGNATURE
              createAssessedByCell(coordinatorName, 'Program Coordinator', owner)
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
      }
    ],
    
    styles: {
      header: {
        fontSize: 16,
        bold: true
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        margin: [0, 3, 0, 3]
      },
      categoryHeader: {
        fillColor: '#e0e0e0',
        fontSize: 10,
        bold: true,
        margin: [4, 6, 4, 6]
      },
      criteriaText: {
        fontSize: 9,
        margin: [4, 3, 4, 3]
      }
    },
    defaultStyle: { 
      fontSize: 11, 
      lineHeight: 1.15 
    }
  };

  pdfMake.createPdf(docDefinition).download(`Form4_Checklist_${new Date().toISOString().split('T')[0]}.pdf`);
};
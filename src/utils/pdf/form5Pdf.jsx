import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const downloadForm5Pdf = (formData, checklist, roleId, owner) => {
  // Get approver names and dates
  const comexName = formData?.commex_approver ? 
    `${formData.commex_approver.firstname} ${formData.commex_approver.lastname}` : 
    '___________________';
  
  const asdName = formData?.asd_approver ? 
    `${formData.asd_approver.firstname} ${formData.asd_approver.lastname}` : 
    '___________________';
  
  const deanName = formData?.dean_approver ? 
    `${formData.dean_approver.firstname} ${formData.dean_approver.lastname}` : 
    '___________________';

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

  // Checklist table rows for Form5
  const checklistRows = [
    // Header row
    [
      { text: 'Criteria', style: 'tableHeader', bold: true },
      { text: 'Yes', style: 'tableHeader', bold: true, alignment: 'center' },
      { text: 'No', style: 'tableHeader', bold: true, alignment: 'center' }
    ],
    
    // I. Relevance to Academic Extension Programs
    [{ text: 'I. Relevance to Academic Extension Programs', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['a', 'b', 'c', 'd'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    // II. Collaborative and Participatory
    [{ text: 'II. Collaborative and Participatory', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['e', 'f', 'g'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    // III. Value(s) Oriented
    [{ text: 'III. Value(s) Oriented', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['h'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    // IV. Financing and Sustainability
    [{ text: 'IV. Financing and Sustainability', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['i', 'j', 'k', 'l'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ]),
    
    // V. Significance
    [{ text: 'V. Significance', colSpan: 3, style: 'categoryHeader', bold: true }, {}, {}],
    ...['m', 'n'].map(key => [
      { text: checklist.find(i => i.key === key)?.label || '', style: 'criteriaText' },
      { text: isChecked(key) ? '/' : '', alignment: 'center' },
      { text: !isChecked(key) ? '/' : '', alignment: 'center' }
    ])
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Title
      {
        text: 'CHECKLIST OF CRITERIA FOR PROJECT PROPOSAL',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
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
        }
      },
      
      // Spacing
      { text: '', margin: [0, 30, 0, 0] },
      
      // Consent Section
      {
        text: 'Consent',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            [
              { text: 'ComEx', style: 'tableHeader', alignment: 'center' },
              { text: 'Academic Services Director / Dean', style: 'tableHeader', alignment: 'center' }
            ],
            [
              {
                stack: [
                  { text: formData?.commex_approved_by ? 'Approved' : 'Awaiting Approval', style: formData?.commex_approved_by ? 'approvedText' : 'awaitingText', alignment: 'center' },
                  { text: comexName, style: 'nameText', alignment: 'center', margin: [0, 5, 0, 0] },
                  { text: formatDate(formData?.commex_approve_date), style: 'dateText', alignment: 'center', margin: [0, 5, 0, 0] }
                ],
                alignment: 'center'
              },
              {
                stack: [
                  { 
                    text: ([1, 4].includes(roleId) ? formData?.asd_approved_by : (formData?.asd_approved_by || formData?.dean_approved_by)) ? 'Approved' : 'Awaiting Approval', 
                    style: ([1, 4].includes(roleId) ? formData?.asd_approved_by : (formData?.asd_approved_by || formData?.dean_approved_by)) ? 'approvedText' : 'awaitingText', 
                    alignment: 'center' 
                  },
                  { 
                    text: [1, 4].includes(roleId) ? asdName : (formData?.asd_approved_by ? asdName : deanName), 
                    style: 'nameText', 
                    alignment: 'center', 
                    margin: [0, 5, 0, 0] 
                  },
                  { 
                    text: formatDate([1, 4].includes(roleId) ? formData?.asd_approve_date : (formData?.asd_approve_date || formData?.dean_approve_date)), 
                    style: 'dateText', 
                    alignment: 'center', 
                    margin: [0, 5, 0, 0] 
                  }
                ],
                alignment: 'center'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function(i, node) { return 1; },
          vLineWidth: function(i, node) { return 1; },
          hLineColor: function(i, node) { return 'black'; },
          vLineColor: function(i, node) { return 'black'; },
        },
        margin: [0, 0, 0, 30]
      },
      
      // Assessed By Section
      {
        table: {
          headerRows: 1,
          widths: ['*'],
          body: [
            [
              { text: 'Assessed By:', style: 'tableHeader', alignment: 'center' }
            ],
            [
              { text: coordinatorName, style: 'nameText', alignment: 'center' }
            ],
            [
              { text: 'Program Coordinator', style: 'roleText', alignment: 'center' }
            ]
          ]
        },
        layout: {
          hLineWidth: function(i, node) { return 1; },
          vLineWidth: function(i, node) { return 1; },
          hLineColor: function(i, node) { return 'black'; },
          vLineColor: function(i, node) { return 'black'; },
        }
      }
    ],
    
    styles: {
      header: {
        fontSize: 16,
        bold: true
      },
      tableHeader: {
        fillColor: '#f0f0f0',
        fontSize: 11,
        bold: true,
        margin: [4, 4, 4, 4]
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
      },
      approvedText: {
        fontSize: 11,
        bold: true,
        color: 'green'
      },
      awaitingText: {
        fontSize: 11,
        italic: true,
        color: '#666666'
      },
      nameText: {
        fontSize: 11,
        bold: true
      },
      dateText: {
        fontSize: 10,
        color: '#666666'
      },
      roleText: {
        fontSize: 10,
        italic: true
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Form5_Project_Checklist_${new Date().toISOString().split('T')[0]}.pdf`);
};
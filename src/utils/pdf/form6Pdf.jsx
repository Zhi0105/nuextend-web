import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// make vfs assignment robust across pdfmake builds:
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const downloadForm6Pdf = (formData, owner) => {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Title
      {
        text: 'MANIFESTATION OF CONSENT AND COOPERATION FOR THE EXTENSION PROGRAM',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      
      // Date
      {
        text: [
          { text: 'Date: ', bold: true },
          formData?.created_at
            ? new Date(formData.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "_____________"
        ],
        alignment: 'right',
        margin: [0, 0, 0, 20]
      },

      // Content
      {
        stack: [
          {
            text: [
              { text: 'To:', bold: true },
              '\n',
              { text: '   Academic Services Director', bold: true }
            ],
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              { text: 'Through:', bold: true },
              '\n',
              { text: '   ComEx Coordinator', bold: true }
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Dear Mr. Venturina,',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              'Greetings! I, as the designated ',
              { text: formData?.designation ?? '_____________', bold: true },
              ', representing the ',
              { text: formData?.organization ?? '_____________', bold: true },
              ', would like to formally inform your good office of our willingness to enter into a partnership with the ',
              { text: formData?.partnership ?? '_____________', bold: true },
              ' of National University in their extension program entitled: ',
              { text: formData?.entitled ?? '_____________', bold: true },
              ', which will run from ',
              { text: formData?.conducted_on ?? '_____________', bold: true },
              ' up until the program\'s termination.'
            ],
            margin: [0, 0, 0, 10]
          },
          {
            text: 'With this manifestation of consent, I also would like to establish our full cooperation on the activities and plans for this said program from the start until it ends as it may be mutually beneficial to both parties involved.',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              'I hereby affix my signature on this date to manifest my concurrence on behalf of the ',
              { text: formData?.behalf_of ?? '_____________', bold: true },
              '.'
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Sincerely,',
            margin: [0, 0, 0, 40]
          },
          // Signature section
          {
            stack: [
              { text: '__________________________', bold: true },
              { text: 'Signature Over Printed Name' },
              { text: `Designation: ${formData?.designation ?? '_____________'}` },
              { text: `Organization/Institution: ${formData?.organization ?? '_____________'}` },
              { text: `Address: ${formData?.address ?? '_____________'}` },
              { text: `Mobile Number: ${formData?.mobile_number ?? '_____________'}` },
              { text: `Email Address: ${formData?.email ?? '_____________'}` }
            ]
          }
        ]
      }
    ],
    
    styles: {
      header: {
        fontSize: 16,
        bold: true
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Form6_Consent_${new Date().toISOString().split('T')[0]}.pdf`);
};
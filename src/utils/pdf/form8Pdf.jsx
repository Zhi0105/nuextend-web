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

export const downloadForm8Pdf = async (form8, event, owner, roleId) => {
  console.log("downloadForm8Pdf called", { form8, event, owner, roleId });
  const logo = await getBase64ImageFromURL('/LogoHeader.png');

  if (!form8) {
    console.warn("downloadForm8Pdf: no form8 provided");
    return;
  }

  // support either an array [obj] or a direct object
  const f = Array.isArray(form8) ? form8[0] || {} : form8 || {};
  const form1Data = event?.form1?.[0];
  
  // Get team leader and members from form1
  const teamLeader = event?.user ? `${event.user.firstname} ${event.user.middlename} ${event.user.lastname}` : "";
  const teamMembers = form1Data?.team_members || [];
  
  const proposedTitle = event?.eventName || "—";
  const introduction = f?.introduction || "—";
  const method = f?.method || "—";
  const findingsDiscussion = f?.findings_discussion || "—";
  const implicationIntervention = f?.implication_intervention || "—";
  const references = f?.references || [];

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
              text: 'Target Group Needs Diagnosis Report Format',
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 0]
            },
            {
              text: 'NUB – ACD – CMX – F – 008',
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
    text: "TARGET GROUP NEEDS DIAGNOSIS REPORT",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 10],
  });

  content.push({
    text: "NEEDS ASSESSMENT REPORT",
    bold: true,
    fontSize: 16,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

  // I. PROPOSED TITLE
  content.push({
    text: "I. PROPOSED TITLE:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });
  content.push({ text: proposedTitle, margin: [0, 0, 0, 15] });

  // II. TEAM
  content.push({
    text: "II. TEAM:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Leader
  content.push({ 
    text: "A. Leader", 
    bold: true, 
    margin: [0, 5, 0, 5] 
  });
  content.push({ 
    text: teamLeader || "No team leader specified", 
    margin: [20, 0, 0, 10] 
  });

  // B. Members
  content.push({ 
    text: "B. Members", 
    bold: true, 
    margin: [0, 5, 0, 5] 
  });
  
  if (teamMembers.length > 0) {
    teamMembers.forEach((member) => {
      content.push({ 
        text: `• ${member.name || "—"}`, 
        margin: [20, 2, 0, 2] 
      });
    });
  } else {
    content.push({ 
      text: "No team members specified", 
      margin: [20, 0, 0, 10] 
    });
  }

  content.push({ text: "", margin: [0, 0, 0, 15] }); // Spacing

  // III. REPORT PROPER
  content.push({
    text: "III. REPORT PROPER:",
    bold: true,
    fontSize: 13,
    margin: [0, 0, 0, 10],
  });

  // A. Introduction
  content.push({ 
    text: "A. Introduction", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: introduction, 
    margin: [0, 0, 0, 15] 
  });

  // B. Method
  content.push({ 
    text: "B. Method", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: method, 
    margin: [0, 0, 0, 15] 
  });

  // C. Findings and Discussion
  content.push({ 
    text: "C. Findings and Discussion", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: findingsDiscussion, 
    margin: [0, 0, 0, 15] 
  });

  // D. Implication for Intervention
  content.push({ 
    text: "D. Implication for Intervention", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  content.push({ 
    text: implicationIntervention, 
    margin: [0, 0, 0, 15] 
  });

  // E. References
  content.push({ 
    text: "E. References", 
    bold: true, 
    margin: [0, 10, 0, 5] 
  });
  
  if (references.length > 0) {
    references.forEach((reference, index) => {
      content.push({ 
        text: `${index + 1}. ${reference.reference || `Reference ${index + 1}`}`, 
        margin: [20, 2, 0, 2] 
      });
    });
  } else {
    content.push({ 
      text: "No references provided", 
      margin: [20, 0, 0, 10] 
    });
  }

  const docDefinition = {
    header: headerContent, // This will appear on every page
    content: content,
    defaultStyle: { 
      fontSize: 11, 
      lineHeight: 1.15 
    },
    pageMargins: [40, 80, 40, 40], // Increased top margin to accommodate header
  };

  pdfMake.createPdf(docDefinition).download("form8-needs-assessment-report.pdf");
};
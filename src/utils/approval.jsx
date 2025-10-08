import _ from "lodash";

// export const checkApprovalProcess = (formNumber, roleId, approvedList = []) => {
//   const approverHierarchy = {
//     1: [9, 1, 10, 11],   // dean -> comex -> asd -> ad
//     2: [9, 1, 10, 11],
//     3: [9, 1, 10, 11],
//     4: [9, 10, 1],       // dean OR asd -> comex
//     5: [9, 10, 1],
//     6: [1],
//     7: [1],
//     8: [1],
//     9: [9, 1, 10, 11],
//     10: [9, 1, 10, 11],
//     11: [1, 10],
//     12: [1, 10],
//     13: [1],
//     14: [1, 10],         // comex -> asd
//   };

//   let approvers = approverHierarchy[formNumber] || [];
//   let included = approvers.includes(roleId);
//   let nextApprover = null;
//   let isFullyApproved = false;

//   if (formNumber === 4 || formNumber === 5) {
//     // Special case: dean OR asd first, then comex
//     const deanOrAsdApproved = approvedList.includes(9) || approvedList.includes(10);

//     if (!deanOrAsdApproved) {
//       nextApprover = [9, 10]; // either can approve
//     } else if (!approvedList.includes(1)) {
//       nextApprover = 1; // comex after dean/asd
//     } else {
//       isFullyApproved = true;
//     }

//     included = (roleId === 1 || roleId === 9 || roleId === 10);
//   } else {
//     // Sequential approval
//     for (let approver of approvers) {
//       if (!approvedList.includes(approver)) {
//         nextApprover = approver;
//         break;
//       }
//     }
//     isFullyApproved = nextApprover === null;
//   }

//   return { approvers, included, approvedList, nextApprover, isFullyApproved };
// }

  const approverMap = {
  1: ["dean", "commex", "asd", "ad"],
  2: ["dean", "commex", "asd", "ad"],
  3: ["dean", "commex", "asd", "ad"],
  4: ["dean", "asd", "commex"], // dean OR asd, plus commex
  5: ["dean", "asd", "commex"], // same as 4
  6: ["commex"],
  7: ["commex"],
  8: ["commex"],
  9: ["dean", "commex", "asd", "ad"],
  10: ["dean", "commex", "asd", "ad"],
  11: ["commex", "asd"],
  12: ["commex", "asd"],
  13: ["commex"],
  14: ["commex", "asd"]
};

export const checkApprovalProcess = (formNumber, roleId, approvedList = [], isNotStudentOwner = false) => {
  const approverHierarchy = {
    1: [9, 1, 10, 11],   // dean -> comex -> asd -> ad
    2: [9, 1, 10, 11],
    3: [9, 1, 10, 11],
    4: [9, 10, 1],       // dean OR asd -> comex
    5: [9, 10, 1],
    6: [1],
    7: [1],
    8: [1],
    9: [9, 1, 10, 11],
    10: [9, 1, 10, 11],
    11: [1, 10],
    12: [1, 10],
    13: [1],
    14: [1, 10],         // comex -> asd
  };

  // Get base approvers
  let approvers = approverHierarchy[formNumber] || [];

  // If faculty owner, exclude dean
  if (isNotStudentOwner) {
    approvers = approvers.filter(a => a !== 9);
  }

  let included = approvers.includes(roleId);
  let nextApprover = null;
  let isFullyApproved = false;

  if (formNumber === 4 || formNumber === 5) {
    // Special case: dean OR asd then comex
    let deanOrAsdIds = isNotStudentOwner ? [10] : [9, 10];
    let deanOrAsdApproved = approvedList.some(r => deanOrAsdIds.includes(r));

    if (!deanOrAsdApproved) {
      nextApprover = deanOrAsdIds; // either dean or asd (or just asd if faculty owner)
    } else if (!approvedList.includes(1)) {
      nextApprover = 1; // comex after dean/asd
    } else {
      isFullyApproved = true;
    }

    included = deanOrAsdIds.includes(roleId) || roleId === 1;
  } else {
    // Sequential approval
    for (let approver of approvers) {
      if (!approvedList.includes(approver)) {
        nextApprover = approver;
        break;
      }
    }
    isFullyApproved = nextApprover === null;
  }

  return { approvers, included, approvedList, nextApprover, isFullyApproved };
}
export const getFormNumber = (pathname) => {
    const result = _.toNumber(_.last(_.split(pathname, '/')));
    return result
}
export const getFormStatus = (form, formNumber, isAdminOwner = false) => {
  if (!form?.length) {
    return <h1 className="text-blue-600">for fill up</h1>;
  }

  const { 
    is_ad, is_asd, is_commex, is_dean,
    is_revised, is_updated
  } = form[0];

  // ✅ Rule 1: any remarks = sent for revised
  if (is_revised) {
    return <h1 className="text-red-400">sent for revised</h1>;
  }

  if (is_updated) {
    return <h1 className="text-blue-400">updated</h1>;
  }

  // ✅ Determine required approvers for this form
  let requiredApprovers = approverMap[formNumber] || [];

  // ✅ If admin owner, exclude dean
  if (isAdminOwner) {
    requiredApprovers = requiredApprovers.filter(a => a !== "dean");
  }

  // ✅ Map of approval flags
  const approverValues = {
    ad: is_ad,
    asd: is_asd,
    commex: is_commex,
    dean: is_dean
  };

  let approvedCount = 0;
  let totalApprovers = requiredApprovers.length;

  // ✅ Special handling for forms 4 & 5
  if (formNumber === 4 || formNumber === 5) {
    // dean OR asd counts as one slot
    const deanOrAsdApproved = isAdminOwner
      ? approverValues.asd // if admin, dean excluded
      : (approverValues.dean || approverValues.asd);

    // if dean/asd slot approved
    if (deanOrAsdApproved) approvedCount++;

    // commex is always required
    if (approverValues.commex) approvedCount++;

    // Total approvers logic
    totalApprovers = 2; // (dean/asd slot + commex)
  } else {
    // ✅ Normal counting
    approvedCount = requiredApprovers.filter(key => approverValues[key]).length;
  }

  // ✅ Rule 2: all required approved → done
  if (approvedCount === totalApprovers) {
    return <h1 className="text-green-500">Approved</h1>;
  }

  // ✅ Otherwise → pending with progress
  return <h1 className="text-yellow-400">{`pending ${approvedCount} / ${totalApprovers}`}</h1>;
};

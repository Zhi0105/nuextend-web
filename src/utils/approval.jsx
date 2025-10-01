import _ from "lodash";

export const checkApprovalProcess = (formNumber, roleId, approvedList = []) => {
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

  let approvers = approverHierarchy[formNumber] || [];
  let included = approvers.includes(roleId);
  let nextApprover = null;
  let isFullyApproved = false;

  if (formNumber === 4 || formNumber === 5) {
    // Special case: dean OR asd first, then comex
    const deanOrAsdApproved = approvedList.includes(9) || approvedList.includes(10);

    if (!deanOrAsdApproved) {
      nextApprover = [9, 10]; // either can approve
    } else if (!approvedList.includes(1)) {
      nextApprover = 1; // comex after dean/asd
    } else {
      isFullyApproved = true;
    }

    included = (roleId === 1 || roleId === 9 || roleId === 10);
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
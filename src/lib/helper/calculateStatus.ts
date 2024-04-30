
type StatusArgs = {
  targetCompletionDate?: Date | null;
  actualCompletionDate?: Date | null;
  previousWaypointStatus?: string | null;
};

export const calculateStatus = ({
  targetCompletionDate,
  actualCompletionDate,
  previousWaypointStatus,
}: StatusArgs): string => {
  const tempNow = new Date();
  const now = new Date(tempNow.getFullYear(), tempNow.getMonth(), tempNow.getDate());

  // console.log(" ");
  //     console.log("calculateStatus: ");
  //     console.log("targetCompletionDate: ", targetCompletionDate);
  //     console.log("actualCompletionDate: ", actualCompletionDate);
  //     console.log("previousWaypointStatus: ", previousWaypointStatus);
      // console.log("calculateStatus: ", status);
  
  if (!actualCompletionDate && previousWaypointStatus &&
      (previousWaypointStatus === 'LATE' ||
       previousWaypointStatus === 'At Risk' ||
       previousWaypointStatus === 'Done Late') &&
      targetCompletionDate &&
      (now <= targetCompletionDate)) {
        // console.log("return At Risk");
    return 'At Risk';
  }

  if (!actualCompletionDate && targetCompletionDate &&
      (now <= targetCompletionDate)) {
        // console.log("return In Progress");
    return 'In Progress';
  }

  if (!actualCompletionDate && targetCompletionDate &&
      (now > targetCompletionDate)) {
        // console.log("return LATE");
    return 'LATE';
  }

  if (actualCompletionDate && targetCompletionDate &&
      actualCompletionDate > targetCompletionDate) {
        // console.log("return Done Late");
    return 'Done Late';
  }

  if (actualCompletionDate && targetCompletionDate &&
      (actualCompletionDate <= targetCompletionDate)) {
        // console.log("return Done");
    return 'Done';
  }
  // console.log("return Undefined");
  return 'Undefined';
};


  // export const calculateStatus = (targetCompletionDate?: Date | null, actualCompletionDate?: Date | null): string => {
  //   const now = new Date();
    
  //   if (actualCompletionDate !== null && actualCompletionDate !== undefined) {
  //     // Completed
  //     if (actualCompletionDate > targetCompletionDate!) {
  //       return "Done Late"; // Completed after the target date
  //     } else {
  //       return "Done"; // Completed on or before the target date
  //     }
  //   } else {
  //     if (targetCompletionDate === null || targetCompletionDate === undefined) {
  //       return "Undefined"; // No target date
  //     }
  //     // Not completed
  //     if (now < targetCompletionDate) {
  //       return "In Progress"; // Current date is before the target date
  //     } else {
  //       return "LATE"; // Current date is after the target date
  //     }
  //   }
  // };
// db.js
const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection(DATABASE_URL='mysql://r7oyd5y4cs0d21zrr4gm:pscale_pw_uhqbZL4oEqwoeQGj5ZpOjulmalArNqxOF6aDOXzTreZ@aws.connect.psdb.cloud/journal-app?ssl={"rejectUnauthorized":true}'
);

connection.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Connected to the database!');
  }
});


async function insertUser(uidVal, pwdVal, uType) {
  const hashedPwd = await bcrypt.hash(pwdVal, 10);
  const insertQuery = `INSERT INTO user (uid, pwd, uType) VALUES (${uidVal}, '${hashedPwd}', '${uType}')`;

  return new Promise((resolve, reject) => {
    connection.query(insertQuery, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("SignUp successfully");
        resolve(true);
      }
    });
  });
}

async function checkUser(uidVal, pwdVal) {
  const selectQuery = `SELECT * FROM user WHERE uid=${uidVal}`;

  return new Promise((resolve, reject) => {
    connection.query(selectQuery, async (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        if (results.length > 0) {
          const user = results[0];
          const hashedPwd = user.pwd;
          const isMatch = await bcrypt.compare(pwdVal, hashedPwd);
          if (isMatch) {
            console.log("User Exists and Password Matches");
            resolve(true); // Return the uType for further usage
          } else {
            console.log("Password does not match");
            reject(new Error("Invalid credentials"));
          }
        } else {
          console.log("User does not exist");
          reject(new Error("Invalid credentials"));
        }
      }
    });
  });
}


async function insertJournal(description, published_at, attachment, tagged_student, teacher_id) {
  const insertQuery = `INSERT INTO journal (description, published_at, attachment, teacher_id) VALUES (?, ?, ?, ?)`;

  try {
    // Insert the journal without the journal_id (auto-incremented)
    const result = await new Promise((resolve, reject) => {
      connection.query(insertQuery, [description, published_at, attachment, teacher_id], async (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Journal Created successfully");
          const journal_id = result.insertId; // Get the auto-incremented journal_id
          console.log("Journal ID:", journal_id);
          if (tagged_student !== null) {
            await addStudents(journal_id, tagged_student); // Call addStudents with journal_id and tagged_student
          }

          resolve(true);
        }
      });
    });

    return result;
  } catch (err) {
    throw err;
  }
}


async function publishJournal(description, attachment, tagged_student, teacher_id) {
  const insertQuery = `INSERT INTO journal (description, published_at, attachment, teacher_id) VALUES (?, CONVERT_TZ(NOW(), '+00:00', '+05:30'), ?, ?)`;

  try {
    // Insert the journal without the journal_id (auto-incremented)
    const result = await new Promise((resolve, reject) => {
      connection.query(insertQuery, [description, attachment, teacher_id], (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Journal Published Successfully");
          // Get the auto-incremented journal_id from the insert result
          const journal_id = result.insertId;
          // Now call addStudents function and pass the journal_id and tagged_student
          addStudents(journal_id, tagged_student);
          resolve(true); // Resolve the promise with true to indicate successful publication
        }
      });
    });

    return result; // Return the resolved value (true) to the caller
  } catch (err) {
    throw err; // Rethrow any error that occurred during the insertion or adding students
  }
}

async function updateJournal(description, attachment, tagged_student, journal_id) {
  try {
    // Get the existing journal attributes from the database
    const existingJournal = await getJournalById(journal_id);

    // If the journal with the given journal_id doesn't exist, return an error
    if (!existingJournal) {
      return { error: 'Journal not found.' };
    }

    // Store the existing attributes in temporary variables
    const existingDescription = existingJournal.description;
    const existingAttachment = existingJournal.attachment;
    const existingTaggedStudents = existingJournal.tagged_student;

    // Check if the body contains the updated attributes, if not, use the existing attributes
    const updatedDescription = description !== undefined ? description : existingDescription;
    const updatedAttachment = attachment !== undefined ? attachment : existingAttachment;
    const updatedTaggedStudents = tagged_student !== undefined ? tagged_student : existingTaggedStudents;

    // Construct the update query with the updated attributes
    const updateQuery = `UPDATE journal SET description = ${updatedDescription !== null ? `'${updatedDescription}'` : 'NULL'}, attachment = ${updatedAttachment !== null ? `'${updatedAttachment}'` : 'NULL'} WHERE journal_id = ${journal_id}`;

    // Execute the update query to update the journal attributes
    await new Promise((resolve, reject) => {
      connection.query(updateQuery, async (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          // Call updateStudents only if there are tagged students to update
          if (updatedTaggedStudents !== undefined && updatedTaggedStudents.length > 0) {
            try {
              await updateStudents(journal_id, updatedTaggedStudents);
              console.log("Journal updated successfully");
              resolve(true);
            } catch (err) {
              reject(err); // Reject with the error if there was an issue updating tagged students
            }
          } else {
            console.log("Journal updated successfully (without updating tagged_student)");
            resolve(true);
          }
        }
      });
    });

    return true;
  } catch (err) {
    throw err;
  }
}

async function insertJournal(description, published_at, attachment, tagged_student, teacher_id) {
  const insertQuery = `INSERT INTO journal (description, published_at, attachment, teacher_id) VALUES (?, ?, ?, ?)`;

  try {
    // Insert the journal without the journal_id (auto-incremented)
    const result = await new Promise((resolve, reject) => {
      connection.query(insertQuery, [description, published_at, attachment, teacher_id], async (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Journal Created successfully");
          const journal_id = result.insertId; // Get the auto-incremented journal_id

          if (tagged_student !== null) {
            await addStudents(journal_id, tagged_student); // Call addStudents with journal_id and tagged_student
          }

          resolve(true);
        }
      });
    });

    return true; // Added this line to indicate successful insertion
  } catch (err) {
    throw err;
  }
}

async function deleteJournal(journal_id){
  const deleteQuery = `DELETE FROM journal WHERE journal_id = ${journal_id}`;

  return new Promise((resolve, reject) => {
    connection.query(deleteQuery, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("Journal deleted successfully");
        resolve(true);
      }
    });
  });
}

// async function studentFeed(uidVal) {
//   console.log("Student Feed uidVal:", uidVal);
//   const searchQuery = `SELECT * FROM stufeed WHERE uid = ${uidVal}`;
//   return new Promise(async (resolve, reject) => {
//     connection.query(searchQuery, async (err, stufeedResults) => {
//       if (err) {
//         console.error(err);
//         reject(err);
//       } else {
//         // Get all the journal_ids from the stufeedResults
//         const journalIds = stufeedResults.map((item) => item.journal_id);
//         console.log("Journal IDs:", journalIds);
//         try {
//           // Check if journalIds is empty
//           if (journalIds.length === 0) {
//             console.log("No journals found for the student.");
//             resolve([]); // Return an empty array as there are no journals for the student
//           } else {
//             // Get the current datetime using await
//             const currentDate = await getCurrentDateTime();
//             // Construct a query to get the journals for the given journal_ids and the published_at is not greater than the current datetime
//             const journalSearchQuery = `SELECT * FROM journal WHERE journal_id IN (${journalIds.join(',')}) AND published_at <= '${currentDate}'`;

//             // Execute the new query to get the filtered journals
//             connection.query(journalSearchQuery, (err, journalResults) => {
//               if (err) {
//                 console.error(err);
//                 reject(err);
//               } else {
//                 console.log("Student Journals:", journalResults);
//                 resolve(journalResults);
//               }
//             });
//           }
//         } catch (err) {
//           console.error('Error getting current datetime:', err);
//           reject(err);
//         }
//       }
//     });
//   });
// }

async function studentFeed(uidVal) {
  console.log("Student Feed uidVal:", uidVal);
  const searchQuery = `SELECT * FROM stufeed WHERE uid = ${uidVal}`;
  return new Promise(async (resolve, reject) => {
    try {
      const stufeedResults = await new Promise((resolve, reject) => {
        connection.query(searchQuery, (err, stufeedResults) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(stufeedResults);
          }
        });
      });

      // Get all the journal_ids from the stufeedResults
      const journalIds = stufeedResults.map((item) => item.journal_id);
      console.log("Journal IDs:", journalIds);

      // Check if journalIds is empty
      if (journalIds.length === 0) {
        console.log("No journals found for the student.");
        resolve([]); // Return an empty array as there are no journals for the student
      } else {
        // Get the current datetime using await
        const currentDate = await getCurrentDateTime();
        // Construct a query to get the journals for the given journal_ids and the published_at is not greater than the current datetime
        const journalSearchQuery = `SELECT * FROM journal WHERE journal_id IN (${journalIds.join(',')}) AND published_at <= '${currentDate}'`;

        // Execute the new query to get the filtered journals
        connection.query(journalSearchQuery, (err, journalResults) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log("Student Journals:", journalResults);
            resolve(journalResults);
          }
        });
      }
    } catch (err) {
      console.error('Error getting current datetime:', err);
      reject(err);
    }
  });
}



// async function teacherFeed(uidVal) {
//   const searchQuery = `SELECT * FROM journal WHERE teacher_id=${uidVal}`;
//   return new Promise((resolve, reject) => {
//     connection.query(searchQuery, (err, results) => {
//       if (err) {
//         console.error(err);
//         reject(err);
//       } else {
//         // console.log("Teacher Feed Results:", results);
//         resolve(results);
//       }
//     });
//   });
// }

async function teacherFeed(uidVal) {
  const searchQuery = `SELECT * FROM journal WHERE teacher_id=${uidVal}`;
  return new Promise((resolve, reject) => {
    connection.query(searchQuery, async (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        // Get an array of journal_ids from the results
        const journalIds = results.map((journal) => journal.journal_id);

        // Query to fetch unique uids for each journal_id from stufeed table
        const studentsQuery = `SELECT DISTINCT uid, journal_id FROM stufeed WHERE journal_id IN (${journalIds.join(',')})`;

        connection.query(studentsQuery, (err, studentResults) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            // Group uids by journal_id to map them back to the respective journal entry
            const studentsMap = {};
            studentResults.forEach((student) => {
              const journal_id = student.journal_id;
              const uid = student.uid;
              if (!studentsMap[journal_id]) {
                studentsMap[journal_id] = [];
              }
              studentsMap[journal_id].push(uid);
            });

            // Combine uids with their respective journal entry
            const journalsWithStudents = results.map((journal) => {
              const journal_id = journal.journal_id;
              const students = studentsMap[journal_id] || [];
              return {
                ...journal,
                tagged_students: students
              };
            });

            // Resolve with the final result
            resolve(journalsWithStudents);
          }
        });
      }
    });
  });
}



async function addStudents(journal_id, tagged_student) {
  const insertPromises = [];
  console.log(tagged_student);
  for (let i = 0; i < tagged_student.length; i++) {
    console.log(tagged_student[i]);
    const insertQuery = `INSERT INTO stufeed (journal_id, uid) VALUES (${journal_id}, ${tagged_student[i]})`;

    // Push the insert operation as a promise to the array
    insertPromises.push(
      new Promise((resolve, reject) => {
        connection.query(insertQuery, (err) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log("Data inserted successfully");
            resolve(true);
          }
        });
      })
    );
  }

  // Wait for all insert operations to complete before resolving the outer promise
  await Promise.all(insertPromises);
}

async function updateStudents(journal_id, tagged_student) {
  const deleteQuery = `DELETE FROM stufeed WHERE journal_id = ${journal_id}`;

  // First, delete the existing tagged students for the given journal_id
  await new Promise((resolve, reject) => {
    connection.query(deleteQuery, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("Existing tagged students removed successfully");
        resolve(true);
      }
    });
  });

  // Now, call the addStudents function to insert the new tagged students for the journal_id
  try {
    await addStudents(journal_id, tagged_student);
    console.log("All tagged students updated successfully");
    return true;
  } catch (err) {
    throw err; // Rethrow any error that occurred during the update
  }
}



// Function to get a journal by its ID from the database
async function getJournalById(journal_id) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM journal WHERE journal_id = ${journal_id}`;

    connection.query(selectQuery, [journal_id], (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        // Assuming journal_id is a primary key, there should be at most one result
        if (results.length === 0) {
          // Journal post not found
          resolve(null);
        } else {
          // Journal post found, return the first result (assuming journal_id is unique)
          resolve(results[0]);
        }
      }
    });
  });
}

function getCurrentDateTime() {
  return new Promise((resolve) => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    resolve(currentDateTime);
  });
}


module.exports = {
  insertUser,
  checkUser,
  insertJournal,
  updateJournal,
  deleteJournal,
  publishJournal,
  studentFeed,
  teacherFeed,
  addStudents,
  getJournalById,
  getCurrentDateTime,
};

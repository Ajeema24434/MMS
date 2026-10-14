/**
 * MMS - AI & DS Department Comprehensive Student Seeding Script
 * 
 * Populates:
 * 1. TY (Year 3): Official 73 students from 'TY List of Mentor-Mentee.pdf' & 'SY AIDS Password.pdf'
 *    - TY-AIDS-A-B1: 19 students
 *    - TY-AIDS-A-B2: 18 students
 *    - TY-AIDS-A-B3: 18 students
 *    - TY-AIDS-A-B4: 18 students
 *    - Exact URNs (10240910nn), Names, Passwords, Roll Nos, and Batch Allocations
 * 
 * 2. FY (Year 1): 80 students in Div A (20/batch) + 80 students in Div B (20/batch) = 160 students
 *    - URNs: 1026091001 to 1026091160
 * 
 * 3. SY (Year 2): 80 students in Div A (20/batch)
 *    - URNs: 1025091001 to 1025091080
 * 
 * 4. BTECH (Year 4): 80 students in Div A (20/batch)
 *    - URNs: 1023091001 to 1023091080
 * 
 * Total: 393 students across all 4 years with bcrypt-hashed passwords,
 * stored initial_passwords, academic records, co-curricular activities,
 * and ML risk classifications (Bright, Average, Weak).
 */

const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));
const bcrypt = require(path.join(__dirname, '../../backend/node_modules/bcryptjs'));

const dbPath = path.join(__dirname, '../../database/mentor_mentee.db');
const db = new Database(dbPath);

console.log('Opened SQLite database at:', dbPath);

// Official TY Students parsed from Departmental PDFs
const tyStudents = [
  // BATCH 1 (TY-AIDS-A-B1) - 19 students
  { batchId: 13, roll: '3064', urn: '1024091071', name: 'Prem Satish Salunkhe', pwd: 'ovgl6106OV', risk: 'Average' },
  { batchId: 13, roll: '3002', urn: '1024041103', name: 'Nikita Dilip Pawar', pwd: 'ihpe3880IH', risk: 'Bright' },
  { batchId: 13, roll: '3003', urn: '1024041109', name: 'Pranav Dnyandev Patil', pwd: 'smyk7393SM', risk: 'Bright' },
  { batchId: 13, roll: '3005', urn: '1024091002', name: 'Pradnya Vijay Yavatkar', pwd: 'vpki8324VP', risk: 'Average' },
  { batchId: 13, roll: '3039', urn: '1024091003', name: 'Sanika Balkrishna Kumbhar', pwd: 'omxz6066OM', risk: 'Average' },
  { batchId: 13, roll: '3041', urn: '1024091008', name: 'Saniya Kalimsab Shaikh', pwd: 'oazo6037OA', risk: 'Average' },
  { batchId: 13, roll: '3008', urn: '1024091010', name: 'Prachi Ankush Jagadale', pwd: 'rpsq7008RP', risk: 'Average' },
  { batchId: 13, roll: '3009', urn: '1024091012', name: 'Aishwarya Shrikrishna More', pwd: 'izgs3967IZ', risk: 'Average' },
  { batchId: 13, roll: '3011', urn: '1024091016', name: 'Vaishnavi Jaywant Deshmukh', pwd: 'utmh7950UT', risk: 'Bright' },
  { batchId: 13, roll: '3013', urn: '1024091021', name: 'Amruta Arjun More', pwd: 'bkwz1680BK', risk: 'Average' },
  { batchId: 13, roll: '3014', urn: '1024091022', name: 'Piyusha Prashant Salavankar', pwd: 'zxxk9894ZX', risk: 'Average' },
  { batchId: 13, roll: '3015', urn: '1024091023', name: 'Sukhada Sadanand Kulkarni', pwd: 'cmpm1867CM', risk: 'Average' },
  { batchId: 13, roll: '3016', urn: '1024091024', name: 'Shreya Mahesh Shete', pwd: 'mrys5379MR', risk: 'Average' },
  { batchId: 13, roll: '3044', urn: '1024091028', name: 'Vedanki Vijay Karande', pwd: 'carb1837CA', risk: 'Average' },
  { batchId: 13, roll: '3019', urn: '1024091029', name: 'Prajkta Nivas Shinde', pwd: 'ansn1052AN', risk: 'Average' },
  { batchId: 13, roll: '3022', urn: '1024091032', name: 'Sanika Uday Pawar', pwd: 'bbqw1523BB', risk: 'Weak' },
  { batchId: 13, roll: '3045', urn: '1024091034', name: 'Sumit Chandrasen Thorat', pwd: 'femt2779FE', risk: 'Average' },
  { batchId: 13, roll: '3046', urn: '1024091035', name: 'Sarang Satish Patil', pwd: 'cqne1994CQ', risk: 'Bright' },
  { batchId: 13, roll: '3047', urn: '1024091036', name: 'Kunal Maruti Shitole', pwd: 'nvwk5507NV', risk: 'Bright' },

  // BATCH 2 (TY-AIDS-A-B2) - 18 students
  { batchId: 14, roll: '3026', urn: '1024091040', name: 'Rushikesh Shashikant Kaware', pwd: 'mwue5193MW', risk: 'Average' },
  { batchId: 14, roll: '3027', urn: '1024091042', name: 'Pratik Machindra Bikkad', pwd: 'dgih2151DG', risk: 'Weak' },
  { batchId: 14, roll: '3029', urn: '1024091045', name: 'Chidanand Guruprasad Telsang', pwd: 'mlwu5164ML', risk: 'Average' },
  { batchId: 14, roll: '3051', urn: '1024091048', name: 'Rajwardhan Dipak Kadam', pwd: 'dulw2122DU', risk: 'Average' },
  { batchId: 14, roll: '3053', urn: '1024091051', name: 'Sushant Dadaso Aladar', pwd: 'uezz8079UE', risk: 'Average' },
  { batchId: 14, roll: '3030', urn: '1024091052', name: 'Kunal Ankush Pisal', pwd: 'nbnq5821NB', risk: 'Bright' },
  { batchId: 14, roll: '3054', urn: '1024091053', name: 'Ayaz Ahmad Choudhary', pwd: 'cwjr1808CW', risk: 'Average' },
  { batchId: 14, roll: '3031', urn: '1024091054', name: 'Anjali Balkrushna Mohite', pwd: 'vtwh8550VT', risk: 'Weak' },
  { batchId: 14, roll: '3032', urn: '1024091055', name: 'Tanmay Arjun Salunkhe', pwd: 'fyfn3064FY', risk: 'Weak' },
  { batchId: 14, roll: '3033', urn: '1024091057', name: 'Aditya Ravindra Salve', pwd: 'nppf5792NP', risk: 'Average' },
  { batchId: 14, roll: '3056', urn: '1024091059', name: 'Tejas Satish Jadhav', pwd: 'vhyx8520VH', risk: 'Average' },
  { batchId: 14, roll: '3057', urn: '1024091060', name: 'Nandini Balkrishna Shrivas', pwd: 'pemo6263PE', risk: 'Bright' },
  { batchId: 14, roll: '3060', urn: '1024091064', name: 'Snehal Vijay Jagadale', pwd: 'ofki5949OF', risk: 'Average' },
  { batchId: 14, roll: '3036', urn: '1024091067', name: 'Prerna Chandrakant Zagade', pwd: 'puhq6420PU', risk: 'Bright' },
  { batchId: 14, roll: '3062', urn: '1024091069', name: 'Sharvil Popat Ghatage', pwd: 'xlri9148XL', risk: 'Average' },
  { batchId: 14, roll: '3063', urn: '1024091070', name: 'Amit Sopan Kadam', pwd: 'vysu8363VY', risk: 'Average' },
  { batchId: 14, roll: '3037', urn: '1024091072', name: 'Pooja Mukundrao Jadhav', pwd: 'yaor9619YA', risk: 'Weak' },
  { batchId: 14, roll: '3068', urn: '1025092005', name: 'Chinmay Girish Deshmukh', pwd: 'ypow2124YC', risk: 'Average' },

  // BATCH 3 (TY-AIDS-A-B3) - 18 students
  { batchId: 15, roll: '3018', urn: '1024091026', name: 'Shivani Suresh Maske', pwd: 'ujik8108UJ', risk: 'Average' },
  { batchId: 15, roll: '3001', urn: '1022091043', name: 'Aditya Vinyak Pawar', pwd: 'wass8678WA', risk: 'Average' },
  { batchId: 15, roll: '3038', urn: '1024071057', name: 'Saba Amjad Shaikh', pwd: 'qyzw6608QY', risk: 'Bright' },
  { batchId: 15, roll: '3004', urn: '1024091001', name: 'Anuja Atul Sawase', pwd: 'xcjw9108XC', risk: 'Bright' },
  { batchId: 15, roll: '3006', urn: '1024091005', name: 'Niranjan Dnyaneshwar Joshi', pwd: 'Dipali@20', risk: 'Bright' },
  { batchId: 15, roll: '3007', urn: '1024091006', name: 'Riddhi Ananda Mane', pwd: 'gjqx3309GJ', risk: 'Average' },
  { batchId: 15, roll: '3043', urn: '1024091014', name: 'Jidnyasa Jitendra Jadhav', pwd: 'mbdp5222MB', risk: 'Average' },
  { batchId: 15, roll: '3010', urn: '1024091015', name: 'Simran Vivek Kakade', pwd: 'jodb4438JO', risk: 'Average' },
  { batchId: 15, roll: '3017', urn: '1024091025', name: 'Gaytri Satish Magar', pwd: 'keze4595KE', risk: 'Average' },
  { batchId: 15, roll: '3021', urn: '1024091031', name: 'Shreyash Ganesh Mahamuni', pwd: 'dppk2308DP', risk: 'Weak' },
  { batchId: 15, roll: '3028', urn: '1024091043', name: 'Gauri Prakash Sakhale', pwd: 'nlrn5664NL', risk: 'Average' },
  { batchId: 15, roll: '3055', urn: '1024091058', name: 'Shubham Netaji Kadam', pwd: 'lcqr5007LC', risk: 'Average' },
  { batchId: 15, roll: '3035', urn: '1024091066', name: 'Arpita Ashokkumar Surve', pwd: 'fpzk2907FP', risk: 'Bright' },
  { batchId: 15, roll: '3066', urn: '1025092003', name: 'Samruddhi Dasharath Amane', pwd: 'hbej7524PB', risk: 'Average' },
  { batchId: 15, roll: '3069', urn: '1025092006', name: 'Shrawani Chandrashekhar Patil', pwd: 'xpga4299ZV', risk: 'Average' },
  { batchId: 15, roll: '3070', urn: '1025092007', name: 'Neha Maruti Sonawale', pwd: 'htir7673YI', risk: 'Average' },
  { batchId: 15, roll: '3071', urn: '1025092008', name: 'Jayant Sunil Talap', pwd: 'trbv7463QI', risk: 'Average' },
  { batchId: 15, roll: '3072', urn: '1025092009', name: 'Shivani Anil Babar', pwd: 'ksaq9424CE', risk: 'Bright' },

  // BATCH 4 (TY-AIDS-A-B4) - 18 students
  { batchId: 16, roll: '3040', urn: '1024091007', name: 'Adiba Akil Tamboli', pwd: 'agdn1051AG', risk: 'Bright' },
  { batchId: 16, roll: '3042', urn: '1024091011', name: 'Mrudula Sanjay Patil', pwd: 'kmfh4751KM', risk: 'Average' },
  { batchId: 16, roll: '3012', urn: '1024091017', name: 'Pragati Babaso Khot', pwd: 'rfnt7166RF', risk: 'Average' },
  { batchId: 16, roll: '3020', urn: '1024091030', name: 'Priyanka Hanmant Patil', pwd: 'ksbt4565KS', risk: 'Average' },
  { batchId: 16, roll: '3023', urn: '1024091033', name: 'Tanuja Ravindra Pawar', pwd: 'uzdm8265UZ', risk: 'Average' },
  { batchId: 16, roll: '3024', urn: '1024091038', name: 'Kirti Anand Nalage', pwd: 'unfc8235UN', risk: 'Average' },
  { batchId: 16, roll: '3025', urn: '1024091039', name: 'Vina Nagappa Halli', pwd: 'oktt5978OK', risk: 'Average' },
  { batchId: 16, roll: '3048', urn: '1024091041', name: 'Sahil Sawanta Lokhande', pwd: 'wbdk8706WB', risk: 'Average' },
  { batchId: 16, roll: '3049', urn: '1024091044', name: 'Sanika Sanjay Mohite', pwd: 'bgno1651BG', risk: 'Bright' },
  { batchId: 16, roll: '3050', urn: '1024091047', name: 'Ajeema Mahamadali Jamadar', pwd: 'tpcq7608TP', risk: 'Bright' },
  { batchId: 16, roll: '3052', urn: '1024091049', name: 'Rohana Sharif Mhaishale Nadaf', pwd: 'ahli1337AH', risk: 'Average' },
  { batchId: 16, roll: '3058', urn: '1024091062', name: 'Shrawani Vardhaman Chougule', pwd: 'xwwf8991XW', risk: 'Average' },
  { batchId: 16, roll: '3059', urn: '1024091063', name: 'Palak Bhupendra Tiwari', pwd: 'eabc2436EA', risk: 'Bright' },
  { batchId: 16, roll: '3034', urn: '1024091065', name: 'Sakshi Santosh Patil', pwd: 'Adcet123456@', risk: 'Bright' },
  { batchId: 16, roll: '3061', urn: '1024091068', name: 'Rabiya Sarfaraj Devale', pwd: 'ngic5635NG', risk: 'Average' },
  { batchId: 16, roll: '3065', urn: '1025092002', name: 'Pradnya Pramod Nangare', pwd: 'rcng6485QM', risk: 'Average' },
  { batchId: 16, roll: '3067', urn: '1025092004', name: 'Sayali Sukhadev Suryawanshi', pwd: 'aauf7878IS', risk: 'Average' },
  { batchId: 16, roll: '3073', urn: '1025092010', name: 'Khadija Ishaq Jamadar', pwd: 'xigx2908LU', risk: 'Bright' }
];

// Rich Pool of Indian Names for Synthetic Generations (FY, SY, BTECH)
const firstNamesM = [
  'Aarav', 'Rohan', 'Siddharth', 'Vikram', 'Ishaan', 'Aditya', 'Rahul', 'Varun', 'Yash', 'Gaurav',
  'Karan', 'Abhishek', 'Harsh', 'Nikhil', 'Pranav', 'Rohit', 'Kunal', 'Sahil', 'Tejas', 'Ayush',
  'Mayur', 'Omkar', 'Parth', 'Rishabh', 'Sanket', 'Saurabh', 'Shreyas', 'Sumit', 'Swapnil', 'Tushar',
  'Vaibhav', 'Vishal', 'Vivek', 'Akshay', 'Aniket', 'Atharva', 'Chetan', 'Darshan', 'Devendra', 'Ganesh',
  'Harshal', 'Jayesh', 'Mahesh', 'Mangesh', 'Nilesh', 'Nitin', 'Prasad', 'Prashant', 'Pravin', 'Rakesh',
  'Sagar', 'Sandeep', 'Santosh', 'Satish', 'Shekhar', 'Shrikant', 'Subhash', 'Sudhir', 'Suraj', 'Sushant',
  'Tanmay', 'Uday', 'Umesh', 'Vikas', 'Vinod', 'Yogesh', 'Ajay', 'Alok', 'Deepak', 'Dinesh'
];

const firstNamesF = [
  'Ananya', 'Priya', 'Diya', 'Kavya', 'Tanvi', 'Meera', 'Neha', 'Pooja', 'Sneha', 'Riddhi',
  'Sanika', 'Shruti', 'Sonal', 'Swati', 'Vaishnavi', 'Gayatri', 'Ishita', 'Manasi', 'Nikita', 'Pallavi',
  'Pranjal', 'Radhika', 'Rutuja', 'Sakshi', 'Samriddhi', 'Sayali', 'Seema', 'Shivani', 'Shreya', 'Snehal',
  'Tejaswini', 'Trisha', 'Vidya', 'Apeksha', 'Ashwini', 'Bhagyashree', 'Chaitali', 'Deepali', 'Dhanashree', 'Harshada',
  'Kalyani', 'Komal', 'Madhuri', 'Mayuri', 'Monali', 'Namrata', 'Nilam', 'Payal', 'Poonam', 'Prajakta',
  'Pranali', 'Pratibha', 'Priyanka', 'Rohini', 'Rupali', 'Sangeeta', 'Sarika', 'Sharmila', 'Sheetal', 'Shobha',
  'Sonali', 'Sujata', 'Sunita', 'Surekha', 'Sushma', 'Urmila', 'Varsha', 'Anita', 'Bhavana', 'Chitra'
];

const lastNames = [
  'Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Shinde', 'Pawar', 'Chavan', 'Jadhav', 'More', 'Mane',
  'Kadam', 'Salunkhe', 'Mohite', 'Bhosale', 'Sawant', 'Gaikwad', 'Shrivas', 'Thakur', 'Sharma', 'Verma',
  'Gupta', 'Singh', 'Kumar', 'Mehta', 'Shah', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Rao',
  'Das', 'Banerjee', 'Mukherjee', 'Sen', 'Roy', 'Dutta', 'Bose', 'Ghosh', 'Bhattacharya', 'Chatterjee',
  'Kambale', 'Babar', 'Suryawanshi', 'Zagade', 'Tamboli', 'Shaikh', 'Nadaf', 'Bikkad', 'Thorat', 'Ghatage'
];

let nameCounter = 0;
function getUniqueName() {
  const isMale = (nameCounter % 2 === 0);
  const firstPool = isMale ? firstNamesM : firstNamesF;
  const fIdx = (nameCounter * 7) % firstPool.length;
  const lIdx = (nameCounter * 11) % lastNames.length;
  nameCounter++;
  return `${firstPool[fIdx]} ${lastNames[lIdx]}`;
}

// Prepare transaction
const cleanOldStudents = db.transaction(() => {
  console.log('Clearing old student users and records (preserving Admin & Mentors)...');
  db.prepare("DELETE FROM activities WHERE student_id IN (SELECT id FROM students)").run();
  db.prepare("DELETE FROM academic_records WHERE student_id IN (SELECT id FROM students)").run();
  db.prepare("DELETE FROM complaints WHERE student_id IN (SELECT id FROM students)").run();
  db.prepare("DELETE FROM students").run();
  db.prepare("DELETE FROM users WHERE role = 'STUDENT'").run();
});

cleanOldStudents();

// Generate students list
const allStudentsData = [];

// ==========================================
// 1. FY (First Year, Year 1)
// Div A: 4 Batches (B1..B4) x 20 students = 80 students
// Div B: 4 Batches (B5..B8) x 20 students = 80 students
// ==========================================
const fyDivABatches = [1, 2, 3, 4];
const fyDivBBatches = [5, 6, 7, 8];

let fyUrnNum = 1;
// FY Div A
for (let bIdx = 0; bIdx < fyDivABatches.length; bIdx++) {
  const bId = fyDivABatches[bIdx];
  for (let s = 1; s <= 20; s++) {
    const urn = `10260910${String(fyUrnNum).padStart(2, '0')}`;
    const roll = `AIDS-FY-A-${String(s).padStart(2, '0')}`;
    const name = getUniqueName();
    const pwd = `Pass@${urn}`;
    const risk = (s % 5 === 0) ? 'Weak' : (s % 3 === 0) ? 'Bright' : 'Average';
    allStudentsData.push({
      batchId: bId,
      year: 1,
      division: 'A',
      roll,
      urn,
      name,
      pwd,
      risk
    });
    fyUrnNum++;
  }
}

// FY Div B
for (let bIdx = 0; bIdx < fyDivBBatches.length; bIdx++) {
  const bId = fyDivBBatches[bIdx];
  for (let s = 1; s <= 20; s++) {
    const urn = `10260910${String(fyUrnNum).padStart(2, '0')}`;
    const roll = `AIDS-FY-B-${String(s).padStart(2, '0')}`;
    const name = getUniqueName();
    const pwd = `Pass@${urn}`;
    const risk = (s % 5 === 0) ? 'Weak' : (s % 3 === 0) ? 'Bright' : 'Average';
    allStudentsData.push({
      batchId: bId,
      year: 1,
      division: 'B',
      roll,
      urn,
      name,
      pwd,
      risk
    });
    fyUrnNum++;
  }
}

// ==========================================
// 2. SY (Second Year, Year 2)
// Div A: 4 Batches (B9..B12) x 20 students = 80 students
// ==========================================
const syBatches = [9, 10, 11, 12];
let syUrnNum = 1;
for (let bIdx = 0; bIdx < syBatches.length; bIdx++) {
  const bId = syBatches[bIdx];
  for (let s = 1; s <= 20; s++) {
    const urn = `10250910${String(syUrnNum).padStart(2, '0')}`;
    const roll = `AIDS-SY-A-${String(s).padStart(2, '0')}`;
    const name = getUniqueName();
    const pwd = `Pass@${urn}`;
    const risk = (s % 6 === 0) ? 'Weak' : (s % 4 === 0) ? 'Bright' : 'Average';
    allStudentsData.push({
      batchId: bId,
      year: 2,
      division: 'A',
      roll,
      urn,
      name,
      pwd,
      risk
    });
    syUrnNum++;
  }
}

// ==========================================
// 3. TY (Third Year, Year 3)
// Div A: 4 Batches (B13..B16) = 73 Official Students
// ==========================================
for (const ty of tyStudents) {
  allStudentsData.push({
    batchId: ty.batchId,
    year: 3,
    division: 'A',
    roll: ty.roll,
    urn: ty.urn,
    name: ty.name,
    pwd: ty.pwd,
    risk: ty.risk
  });
}

// ==========================================
// 4. BTECH (Final Year, Year 4)
// Div A: 4 Batches (B17..B20) x 20 students = 80 students
// ==========================================
const btechBatches = [17, 18, 19, 20];
let btUrnNum = 1;
for (let bIdx = 0; bIdx < btechBatches.length; bIdx++) {
  const bId = btechBatches[bIdx];
  for (let s = 1; s <= 20; s++) {
    const urn = `10230910${String(btUrnNum).padStart(2, '0')}`;
    const roll = `AIDS-BT-A-${String(s).padStart(2, '0')}`;
    const name = getUniqueName();
    const pwd = `Pass@${urn}`;
    const risk = (s % 7 === 0) ? 'Weak' : (s % 3 === 0) ? 'Bright' : 'Average';
    allStudentsData.push({
      batchId: bId,
      year: 4,
      division: 'A',
      roll,
      urn,
      name,
      pwd,
      risk
    });
    btUrnNum++;
  }
}

console.log(`Prepared ${allStudentsData.length} students across 4 classes:`);
console.log(`- FY (Year 1): 160 students (Div A: 80, Div B: 80, 20 per batch)`);
console.log(`- SY (Year 2): 80 students (Div A: 80, 20 per batch)`);
console.log(`- TY (Year 3): 73 students (Official list: B1=19, B2=18, B3=18, B4=18)`);
console.log(`- BTech (Year 4): 80 students (Div A: 80, 20 per batch)`);

// Database Insertion Statements
const insertUserStmt = db.prepare(`
  INSERT INTO users (role, identifier, password_hash, initial_password, name, email, is_active)
  VALUES ('STUDENT', ?, ?, ?, ?, ?, 1)
`);

const insertStudentStmt = db.prepare(`
  INSERT INTO students (user_id, urn, roll_no, department, year, division, semester, phone, batch_id, ml_risk_level)
  VALUES (?, ?, ?, 'AI & DS', ?, ?, ?, ?, ?, ?)
`);

const insertAcademicStmt = db.prepare(`
  INSERT INTO academic_records (student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertActivityStmt = db.prepare(`
  INSERT INTO activities (student_id, title, category, description, date_achieved)
  VALUES (?, ?, ?, ?, ?)
`);

// Pre-compute bcrypt hashes for performance (memoized)
const hashCache = new Map();
function getHash(pwd) {
  if (hashCache.has(pwd)) return hashCache.get(pwd);
  const hash = bcrypt.hashSync(pwd, 10);
  hashCache.set(pwd, hash);
  return hash;
}

// Activity templates
const sampleActivities = [
  { title: 'NPTEL Certification - Deep Learning', category: 'Certification', desc: 'Completed 12-week NPTEL course with Elite certificate.' },
  { title: 'National AI Hackathon - Finalist', category: 'Technical Event', desc: 'Selected among top 10 teams in smart campus innovation track.' },
  { title: 'Industry Internship - Data Science Intern', category: 'Internship', desc: '2-month hands-on training in machine learning pipelines.' },
  { title: 'Research Workshop on Large Language Models', category: 'Workshop', desc: 'Attended 3-day IEEE certified generative AI workshop.' },
  { title: 'Inter-College Sports Badminton Championship', category: 'Sports', desc: 'Secured 2nd position in district level badminton tournament.' }
];

console.log('Inserting students into database...');

const insertAll = db.transaction(() => {
  let count = 0;
  for (const s of allStudentsData) {
    const pHash = getHash(s.pwd);
    const email = `${s.urn}@student.mms.edu`;
    const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const sem = s.year * 2 - 1; // 1, 3, 5, 7

    // 1. Insert User
    const userRes = insertUserStmt.run(s.urn, pHash, s.pwd, s.name, email);
    const userId = userRes.lastInsertRowid;

    // 2. Insert Student
    const studentRes = insertStudentStmt.run(userId, s.urn, s.roll, s.year, s.division, sem, phone, s.batchId, s.risk);
    const studentId = studentRes.lastInsertRowid;

    // 3. Generate Academic Record
    let cgpa = 7.5;
    let att = 82.5;
    let ise = 17.5;
    let mse = 21.0;
    let ese = 52.0;
    let failed = 0;
    let defaulter = 0;

    if (s.risk === 'Bright') {
      cgpa = +(8.4 + Math.random() * 1.4).toFixed(2);
      att = +(85 + Math.random() * 12).toFixed(1);
      ise = +(18 + Math.random() * 2).toFixed(1);
      mse = +(24 + Math.random() * 5).toFixed(1);
      ese = +(58 + Math.random() * 10).toFixed(1);
      failed = 0;
      defaulter = 0;
    } else if (s.risk === 'Weak') {
      cgpa = +(5.0 + Math.random() * 1.5).toFixed(2);
      att = +(55 + Math.random() * 18).toFixed(1);
      ise = +(10 + Math.random() * 4).toFixed(1);
      mse = +(12 + Math.random() * 5).toFixed(1);
      ese = +(32 + Math.random() * 10).toFixed(1);
      failed = Math.random() > 0.4 ? 1 : 2;
      defaulter = 1;
    } else {
      cgpa = +(6.8 + Math.random() * 1.4).toFixed(2);
      att = +(76 + Math.random() * 10).toFixed(1);
      ise = +(14 + Math.random() * 4).toFixed(1);
      mse = +(18 + Math.random() * 5).toFixed(1);
      ese = +(46 + Math.random() * 10).toFixed(1);
      failed = 0;
      defaulter = 0;
    }

    insertAcademicStmt.run(studentId, sem, cgpa, att, ise, mse, ese, failed, defaulter);

    // 4. Insert 1-2 Activities
    const act1 = sampleActivities[count % sampleActivities.length];
    insertActivityStmt.run(studentId, act1.title, act1.category, act1.desc, '2024-09-15');

    if (count % 3 === 0) {
      const act2 = sampleActivities[(count + 2) % sampleActivities.length];
      insertActivityStmt.run(studentId, act2.title, act2.category, act2.desc, '2024-11-20');
    }

    count++;
  }
  return count;
});

const totalInserted = insertAll();
console.log(`Successfully populated ${totalInserted} students into mentor_mentee.db!`);

// Print verification summary
const summary = db.prepare(`
  SELECT b.id, b.name, b.year, b.division, COUNT(s.id) as student_count, u.name as mentor_name
  FROM batches b
  LEFT JOIN students s ON s.batch_id = b.id
  LEFT JOIN mentors m ON b.mentor_id = m.id
  LEFT JOIN users u ON m.user_id = u.id
  GROUP BY b.id
  ORDER BY b.year, b.division, b.name
`).all();

console.log('\n--- BATCH ALLOCATION SUMMARY ---');
summary.forEach(row => {
  console.log(`Batch ${row.id} [${row.name}] (Year ${row.year}, Div ${row.division}): ${row.student_count} students -> Mentor: ${row.mentor_name}`);
});

const totalCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
console.log(`\nTOTAL ACTIVE STUDENTS: ${totalCount}`);

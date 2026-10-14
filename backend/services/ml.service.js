const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');

/**
 * Service to execute real ML model predictions via python script.
 * Zero hardcoding — uses trained Scikit-learn Pipeline (best_model.joblib).
 */
const mlService = {
  /**
   * Run full batch ML analysis on all active students.
   */
  runBatchAnalysis: () => {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../ml/predict_student_risk.py');
      const pythonProcess = spawn('python', [scriptPath], {
        cwd: path.join(__dirname, '../..')
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('ML Batch Analysis completed successfully.');
          resolve({ success: true, output: stdoutData });
        } else {
          logger.error(`ML script exited with code ${code}: ${stderrData}`);
          reject(new Error(`ML script failed with code ${code}`));
        }
      });
    });
  }
};

module.exports = mlService;

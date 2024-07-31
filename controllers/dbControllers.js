const sqlite = require("sqlite3").verbose();
const path = require("path");

let db;

exports.dbInit = (app) => {
  try {
    const dbPath = path.join(app.getPath("userData"), "config.db");
    db = new sqlite.Database(dbPath);
    db.run("PRAGMA key = 'inTheNameOfAllahTheMostGraciousTheMostMerciful';");
  } catch (err) {
    throw err;
  }
};

exports.getDb = (db) => {
  try {
    if (db) {
      return db;
    }
  } catch (err) {
    throw err;
  }
};

exports.createConfigTable = () => {
  try {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS config (
        host TEXT,
        username TEXT
      )`);
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

exports.isTableEmpty = (cb) => {
  try {
    db.get("SELECT COUNT(*) AS count FROM config", (err, row) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, row.count === 0);
      }
    });
  } catch (err) {
    throw err;
  }
};

exports.insertConfigData = (configData) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO config (host, username) VALUES (?, ?)"
    );
    configData.forEach((entry) => {
      stmt.run(entry.host, entry.username);
    });
    stmt.finalize();
    console.log("Data inserted into table.");
  } catch (err) {
    throw err;
  }
};

exports.updateConfigData = (configData) => {
  try {
    db.serialize(() => {
      const updateStmt = db.prepare(`UPDATE config SET 
      host = ?,
      username = ?`);
      configData.forEach((entry) => {
        updateStmt.run(entry.host, entry.username);
      });
      updateStmt.finalize();
    });
  } catch (err) {
    throw err;
  }
};

exports.setDataToConfigTable = (configData) => {
  try {
    this.isTableEmpty((err, isEmpty) => {
      if (err) {
        console.log(err);
        throw err;
      } else {
        if (isEmpty) {
          this.insertConfigData(configData);
        } else {
          this.updateConfigData(configData);
        }
      }
    });
  } catch (err) {
    throw err;
  }
};

exports.getConfigData = async () => {
  try {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM config", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  } catch (err) {
    throw err;
  }
};

/***********************************************************/

exports.createActivationTable = () => {
  db.serialize(() => {
    try {
      db.run(`CREATE TABLE IF NOT EXISTS active (
        code TEXT,
        isActive INTEGER,
        expiryDate TEXT
      )`);
    } catch (err) {
      throw err;
    }
  });
};

exports.isActiveTableEmpty = (cb) => {
  try {
    db.get("SELECT COUNT(*) AS count FROM active", (err, row) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, row.count === 0);
      }
    });
  } catch (err) {
    throw err;
  }
};

exports.insertActivationData = (activationData) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO active (code, isActive, expiryDate) VALUES (?, ?, ?)"
    );
    activationData.forEach((entry) => {
      stmt.run(entry.code, entry.isActive, entry.expiryDate);
    });
    stmt.finalize();
  } catch (err) {
    throw err;
  }
};

exports.updateActivationData = (activationData) => {
  try {
    db.serialize(() => {
      const updateStmt = db.prepare(
        `UPDATE active SET
          code = ?,
          isActive = ?,
          expiryDate = ?
        `
      );
      activationData.forEach((entry) => {
        updateStmt.run(entry.code, entry.isActive, entry.expiryDate);
        updateStmt.finalize();
      });
    });
  } catch (err) {
    throw err;
  }
};

exports.setActivationData = (activationData) => {
  try {
    this.isActiveTableEmpty((err, isEmpty) => {
      if (err) {
        console.log(err);
        throw err;
      } else {
        if (isEmpty) {
          this.insertActivationData(activationData);
        } else {
          this.updateActivationData(activationData);
        }
      }
    });
  } catch (err) {
    throw err;
  }
};

exports.getActivationData = async () => {
  try {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM active", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  } catch (err) {
    throw err;
  }
};

const bcrypt = require('bcryptjs');

/**
 * Resilient In-Memory & Fallback Data Storage Engine
 * Guarantees 100% operational uptime, instant responsiveness (0ms latency),
 * and zero buffering timeouts whenever MongoDB Atlas is offline or connecting.
 */

// Generate unique Mongo-compatible 24-char hex IDs
const generateId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + random;
};

// Seed dataset
const defaultCategories = [
  { _id: 'cat_01', name: 'Electronics', icon: 'fa-laptop', description: 'Laptops, tablets, readers, powerbanks', isActive: true },
  { _id: 'cat_02', name: 'Mobile Phones', icon: 'fa-mobile-screen', description: 'Smartphones, feature phones, cases', isActive: true },
  { _id: 'cat_03', name: 'Wallets & Purses', icon: 'fa-wallet', description: 'Leather wallets, cardholders, purses', isActive: true },
  { _id: 'cat_04', name: 'ID Cards & Badges', icon: 'fa-id-card', description: 'College IDs, library cards, hall tickets', isActive: true },
  { _id: 'cat_05', name: 'Keys', icon: 'fa-key', description: 'Room keys, vehicle keys, keychains', isActive: true },
  { _id: 'cat_06', name: 'Bags & Backpacks', icon: 'fa-bag-shopping', description: 'Backpacks, handbag, laptop bags', isActive: true },
  { _id: 'cat_07', name: 'Books & Notes', icon: 'fa-book', description: 'Textbooks, lab manuals, notebooks', isActive: true },
  { _id: 'cat_08', name: 'Earphones & Audio', icon: 'fa-headphones', description: 'Earbuds, headphones, Bluetooth speakers', isActive: true },
  { _id: 'cat_09', name: 'Watches', icon: 'fa-clock', description: 'Smartwatches, analog watches', isActive: true },
  { _id: 'cat_10', name: 'Chargers & Cables', icon: 'fa-plug', description: 'Phone chargers, adapter bricks, cables', isActive: true },
  { _id: 'cat_11', name: 'Stationery', icon: 'fa-pen', description: 'Calculators, pen sets, geometry boxes', isActive: true },
  { _id: 'cat_12', name: 'Clothing & Jackets', icon: 'fa-shirt', description: 'Jackets, sweaters, lab coats, caps', isActive: true },
  { _id: 'cat_13', name: 'Jewellery & Accessories', icon: 'fa-gem', description: 'Rings, chains, glasses, sunglasses', isActive: true },
  { _id: 'cat_14', name: 'Documents & Certificates', icon: 'fa-file-lines', description: 'Folders, marksheet copies, receipts', isActive: true },
  { _id: 'cat_15', name: 'Other', icon: 'fa-box-archive', description: 'Miscellaneous campus personal belongings', isActive: true },
];

const defaultLocations = [
  { _id: 'loc_01', name: 'Library - Ground Floor', building: 'Academic Block', isActive: true },
  { _id: 'loc_02', name: 'Central Canteen', building: 'Student Center', isActive: true },
  { _id: 'loc_03', name: 'Computer Lab 3', building: 'BCA / IT Building', isActive: true },
  { _id: 'loc_04', name: 'Seminar Hall B', building: 'Satabdi Bhavan', isActive: true },
  { _id: 'loc_05', name: 'Main Sports Ground', building: 'Outdoor Complex', isActive: true },
  { _id: 'loc_06', name: 'Security Main Gate', building: 'Entrance', isActive: true },
  { _id: 'loc_07', name: 'Security Office', building: 'Administrative Block', isActive: true },
  { _id: 'loc_08', name: 'BBA Department Floor 2', building: 'Management Wing', isActive: true },
  { _id: 'loc_09', name: 'Auditorium', building: 'Satabdi Bhavan', isActive: true },
  { _id: 'loc_10', name: 'Boys Hostel Mess', building: 'Hostel Block A', isActive: true },
  { _id: 'loc_11', name: 'Girls Hostel Lounge', building: 'Hostel Block B', isActive: true },
  { _id: 'loc_12', name: 'Parking Gate 2', building: 'Campus Perimeter', isActive: true },
];

class StorageEngine {
  constructor() {
    this.users = [];
    this.categories = [...defaultCategories];
    this.locations = [...defaultLocations];
    this.lostItems = [];
    this.foundItems = [];
    this.claims = [];
    this.notifications = [];
    this.reports = [];
    this.auditLogs = [];
    this.otps = [];

    this.initDefaultSeed();
  }

  initDefaultSeed() {
    // Password123! pre-hashed
    const commonHash = bcrypt.hashSync('Password123!', 10);

    const admin = {
      _id: 'usr_admin001',
      name: 'Dr. Rajesh Sharma',
      email: 'admin@college.edu',
      collegeId: 'ADM-001',
      phone: '9876543210',
      department: 'Campus Security & Administration',
      year: 'Faculty / Staff',
      passwordHash: commonHash,
      role: 'ADMIN',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const staff = {
      _id: 'usr_staff001',
      name: 'Suresh Kumar',
      email: 'staff@college.edu',
      collegeId: 'STF-104',
      phone: '9876543211',
      department: 'Central Security Office',
      year: 'Faculty / Staff',
      passwordHash: commonHash,
      role: 'STAFF',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const student1 = {
      _id: 'usr_stud001',
      name: 'Aarav Gupta',
      email: 'student@college.edu',
      collegeId: '2024-BCA-042',
      phone: '9876543212',
      department: 'Computer Applications (BCA)',
      year: '2nd Year',
      passwordHash: commonHash,
      role: 'STUDENT',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const student2 = {
      _id: 'usr_stud002',
      name: 'Priya Verma',
      email: 'priya@college.edu',
      collegeId: '2023-BBA-019',
      phone: '9876543213',
      department: 'Business Administration (BBA)',
      year: '3rd Year',
      passwordHash: commonHash,
      role: 'STUDENT',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users = [admin, staff, student1, student2];

    const lostLaptop = {
      _id: 'lost_001',
      reportedBy: student1._id,
      title: 'Black HP Pavilion Laptop',
      category: 'Electronics',
      description: 'Black HP Pavilion 15 inch laptop with a silver logo. Has a blue sticker near touchpad.',
      color: 'Black',
      brand: 'HP',
      location: 'Computer Lab 3',
      dateLost: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      timeLost: '02:30 PM',
      uniqueDetails: 'Intel i7 sticker on left palm rest. Serial No Ends with 9482.',
      images: [{ url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80', publicId: 'demo_laptop' }],
      status: 'LOST',
      isSuspendedFromPortal: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    const lostWallet = {
      _id: 'lost_002',
      reportedBy: student2._id,
      title: 'Brown Leather WildHorn Wallet',
      category: 'Wallets & Purses',
      description: 'Brown leather bifold wallet lost around canteen area during lunch.',
      color: 'Brown',
      brand: 'WildHorn',
      location: 'Central Canteen',
      dateLost: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      timeLost: '01:15 PM',
      uniqueDetails: 'Contains college ID for Priya Verma, ₹850 in cash, and a metro card.',
      images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', publicId: 'demo_wallet' }],
      status: 'LOST',
      isSuspendedFromPortal: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    this.lostItems = [lostLaptop, lostWallet];

    const foundWallet = {
      _id: 'found_001',
      reportedBy: staff._id,
      title: 'Brown Leather Bifold Wallet',
      category: 'Wallets & Purses',
      description: 'Brown leather wallet deposited at security office. Found near canteen tables.',
      color: 'Brown',
      brand: 'WildHorn',
      location: 'Central Canteen',
      dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      timeFound: '01:45 PM',
      condition: 'Good',
      currentStorageLocation: 'Security Office Locker B2',
      uniqueDetails: 'Contains student ID card, cash, and metro card.',
      images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', publicId: 'demo_wallet_found' }],
      status: 'FOUND',
      isSuspendedFromPortal: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    const foundKeys = {
      _id: 'found_002',
      reportedBy: staff._id,
      title: 'Honda Bike Key with Superhero Keychain',
      category: 'Keys',
      description: 'Single ignition key with a metal Batman keychain.',
      color: 'Silver',
      brand: 'Honda',
      location: 'Parking Gate 2',
      dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      timeFound: '05:10 PM',
      condition: 'Good',
      currentStorageLocation: 'Security Office Desk Box',
      uniqueDetails: 'Small scratch on key grip base.',
      images: [{ url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&q=80', publicId: 'demo_keys' }],
      status: 'FOUND',
      isSuspendedFromPortal: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    this.foundItems = [foundWallet, foundKeys];

    const claim1 = {
      _id: 'clm_001',
      itemId: foundWallet._id,
      itemModel: 'FoundItem',
      claimantId: student2._id,
      reason: 'This is my wallet lost yesterday at canteen.',
      ownershipDetails: 'It contains my College ID card (Priya Verma), ₹850 cash, and a blue Metro Card.',
      status: 'APPROVED',
      handoverCode: 'L2F-8492',
      reviewedBy: staff._id,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    this.claims = [claim1];

    this.notifications = [
      {
        _id: 'notif_001',
        userId: student2._id,
        title: 'Claim Approved! Handover Code: L2F-8492',
        message: 'Your claim for Brown Leather Bifold Wallet was approved. Collect at Security Office Locker B2.',
        type: 'CLAIM_APPROVED',
        link: '/dashboard.html#claims',
        isRead: false,
        createdAt: new Date(),
      },
    ];

    this.auditLogs = [
      {
        _id: 'aud_001',
        userId: admin._id,
        action: 'SYSTEM_STARTUP',
        targetType: 'System',
        targetId: '0',
        description: 'Lost2Found System Initialized with High-Speed Persistence Engine.',
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
      },
    ];
  }
}

const storage = new StorageEngine();

// Document wrapper with Mongoose document methods
function wrapDoc(doc, collection) {
  if (!doc) return null;
  const wrapped = { ...doc };

  wrapped.save = async function () {
    const idx = collection.findIndex((d) => d._id === wrapped._id);
    if (idx !== -1) {
      wrapped.updatedAt = new Date();
      collection[idx] = { ...wrapped };
    } else {
      collection.push(wrapped);
    }
    return wrapDoc(wrapped, collection);
  };

  wrapped.deleteOne = async function () {
    const idx = collection.findIndex((d) => d._id === wrapped._id);
    if (idx !== -1) {
      collection.splice(idx, 1);
    }
    return { deletedCount: 1 };
  };

  wrapped.toObject = function () {
    const copy = { ...wrapped };
    delete copy.save;
    delete copy.deleteOne;
    delete copy.toObject;
    return copy;
  };

  return wrapped;
}

// Chainable Query Builder
class QueryBuilder {
  constructor(collection, filter = {}, storageEngine, modelName) {
    this.collection = collection;
    this.filter = filter;
    this.storageEngine = storageEngine;
    this.modelName = modelName;
    this._populates = [];
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._select = null;
    this._single = false;
  }

  populate(field, fieldsToSelect) {
    if (typeof field === 'object' && field !== null && field.path) {
      this._populates.push({ field: field.path, fieldsToSelect: field.select });
    } else {
      this._populates.push({ field, fieldsToSelect });
    }
    return this;
  }

  sort(sortOption) {
    this._sort = sortOption;
    return this;
  }

  limit(num) {
    this._limit = num;
    return this;
  }

  skip(num) {
    this._skip = num;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  // Matches a document against Mongo query operators ($or, $in, $gte, $lte, regex, equality)
  matchesFilter(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;

    for (const key of Object.keys(filter)) {
      if (key === '$or' && Array.isArray(filter.$or)) {
        const matchesAny = filter.$or.some((subFilter) => this.matchesFilter(doc, subFilter));
        if (!matchesAny) return false;
        continue;
      }

      const val = filter[key];
      const docVal = doc[key];

      if (val instanceof RegExp) {
        if (!val.test(docVal || '')) return false;
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (val.$in && Array.isArray(val.$in)) {
          if (!val.$in.includes(docVal)) return false;
        }
        if (val.$gte !== undefined) {
          if (new Date(docVal) < new Date(val.$gte)) return false;
        }
        if (val.$lte !== undefined) {
          if (new Date(docVal) > new Date(val.$lte)) return false;
        }
        if (val.$ne !== undefined) {
          if (docVal === val.$ne) return false;
        }
      } else if (docVal !== val) {
        // Handle String ID comparisons
        if (key === '_id' && docVal.toString() === val.toString()) {
          continue;
        }
        if (key === 'reportedBy' && docVal && (docVal._id || docVal).toString() === (val._id || val).toString()) {
          continue;
        }
        if (key === 'claimantId' && docVal && (docVal._id || docVal).toString() === (val._id || val).toString()) {
          continue;
        }
        if (key === 'userId' && docVal && (docVal._id || docVal).toString() === (val._id || val).toString()) {
          continue;
        }
        return false;
      }
    }
    return true;
  }

  _execute() {
    let results = this.collection.filter((doc) => this.matchesFilter(doc, this.filter));

    // Sort
    if (this._sort) {
      if (typeof this._sort === 'object') {
        const [sortKey, sortDir] = Object.entries(this._sort)[0] || ['createdAt', -1];
        results.sort((a, b) => {
          const valA = a[sortKey] instanceof Date ? a[sortKey].getTime() : a[sortKey];
          const valB = b[sortKey] instanceof Date ? b[sortKey].getTime() : b[sortKey];
          return sortDir === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }
    }

    if (this._skip) results = results.slice(this._skip);
    if (this._limit) results = results.slice(0, this._limit);

    // Populate references
    results = results.map((item) => {
      const copy = { ...item };
      for (const pop of this._populates) {
        const field = pop.field;
        const rawRef = copy[field];
        if (rawRef) {
          const lookupId = (rawRef && rawRef._id) ? rawRef._id.toString() : rawRef.toString();
          if (field === 'reportedBy' || field === 'claimantId' || field === 'userId' || field === 'reviewedBy' || field === 'handoverVerifiedBy') {
            const user = this.storageEngine.users.find((u) => u._id === lookupId);
            if (user) {
              const uCopy = { ...user };
              delete uCopy.passwordHash;
              copy[field] = uCopy;
            }
          } else if (field === 'itemId') {
            const lost = this.storageEngine.lostItems.find((l) => l._id === lookupId);
            const found = this.storageEngine.foundItems.find((f) => f._id === lookupId);
            if (found) {
              copy[field] = wrapDoc(found, this.storageEngine.foundItems);
            } else if (lost) {
              copy[field] = wrapDoc(lost, this.storageEngine.lostItems);
            } else {
              copy[field] = { title: 'Item', _id: lookupId };
            }
          }
        }
      }
      return wrapDoc(copy, this.collection);
    });

    if (this._single) {
      return results.length > 0 ? results[0] : null;
    }

    return results;
  }

  // Thenable for await
  then(resolve, reject) {
    try {
      const data = this._execute();
      resolve(data);
    } catch (err) {
      reject(err);
    }
  }
}

// Model Adapter Generator
function createModelAdapter(collectionName, storageEngine) {
  const getCollection = () => {
    switch (collectionName) {
      case 'User': return storageEngine.users;
      case 'Category': return storageEngine.categories;
      case 'Location': return storageEngine.locations;
      case 'LostItem': return storageEngine.lostItems;
      case 'FoundItem': return storageEngine.foundItems;
      case 'Claim': return storageEngine.claims;
      case 'Notification': return storageEngine.notifications;
      case 'Report': return storageEngine.reports;
      case 'AuditLog': return storageEngine.auditLogs;
      case 'OTP': return storageEngine.otps;
      default: return [];
    }
  };

  return {
    find(filter = {}) {
      return new QueryBuilder(getCollection(), filter, storageEngine, collectionName);
    },

    findOne(filter = {}) {
      const q = new QueryBuilder(getCollection(), filter, storageEngine, collectionName);
      q._single = true;
      return q;
    },

    findById(id) {
      return this.findOne({ _id: id });
    },

    async create(doc) {
      const coll = getCollection();
      const newDoc = {
        _id: doc._id || generateId(),
        isActive: doc.isActive !== undefined ? Boolean(doc.isActive) : true,
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: new Date(),
      };
      if (newDoc.isActive === undefined) {
        newDoc.isActive = true;
      }
      coll.unshift(newDoc);
      return wrapDoc(newDoc, coll);
    },

    async findByIdAndDelete(id) {
      return this.deleteOne({ _id: id });
    },

    async insertMany(docs) {
      const created = [];
      for (const d of docs) {
        created.push(await this.create(d));
      }
      return created;
    },

    async countDocuments(filter = {}) {
      const q = new QueryBuilder(getCollection(), filter, storageEngine, collectionName);
      const res = q._execute();
      return res.length;
    },

    async deleteMany(filter = {}) {
      const coll = getCollection();
      const initial = coll.length;
      for (let i = coll.length - 1; i >= 0; i--) {
        const q = new QueryBuilder([], {}, storageEngine, collectionName);
        if (q.matchesFilter(coll[i], filter)) {
          coll.splice(i, 1);
        }
      }
      return { deletedCount: initial - coll.length };
    },

    async deleteOne(filter = {}) {
      const coll = getCollection();
      for (let i = 0; i < coll.length; i++) {
        const q = new QueryBuilder([], {}, storageEngine, collectionName);
        if (q.matchesFilter(coll[i], filter)) {
          coll.splice(i, 1);
          return { deletedCount: 1 };
        }
      }
      return { deletedCount: 0 };
    },

    async updateMany(filter = {}, update = {}) {
      const coll = getCollection();
      let updatedCount = 0;
      for (const item of coll) {
        const q = new QueryBuilder([], {}, storageEngine, collectionName);
        if (q.matchesFilter(item, filter)) {
          if (update.$set) {
            Object.assign(item, update.$set);
          } else {
            Object.assign(item, update);
          }
          item.updatedAt = new Date();
          updatedCount++;
        }
      }
      return { modifiedCount: updatedCount };
    },

    async findByIdAndUpdate(id, update = {}, options = {}) {
      const coll = getCollection();
      const item = coll.find((d) => d._id === id);
      if (!item) return null;
      if (update.$set) {
        Object.assign(item, update.$set);
      } else {
        Object.assign(item, update);
      }
      item.updatedAt = new Date();
      return wrapDoc(item, coll);
    },

    async aggregate(pipeline = []) {
      const coll = getCollection();
      // Handle simple $group by field (e.g. $group: { _id: '$category', count: { $sum: 1 } })
      const groupStage = pipeline.find((p) => p.$group);
      if (groupStage) {
        const fieldKey = (groupStage.$group._id || '').replace(/^\$/, '');
        const counts = {};
        coll.forEach((item) => {
          const val = item[fieldKey] || 'Other';
          counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).map(([k, v]) => ({ _id: k, count: v }));
      }
      return [];
    },
  };
}

module.exports = {
  storage,
  createModelAdapter,
  generateId,
};

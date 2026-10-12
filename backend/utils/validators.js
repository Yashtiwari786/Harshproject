const { check, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: extractedErrors[0]?.message || 'Validation error',
      errors: extractedErrors,
    });
  };
};

const registerValidationRules = [
  check('name', 'Full Name is required').notEmpty().trim(),
  check('email', 'Please provide a valid college email').isEmail().normalizeEmail(),
  check('collegeId', 'College ID / Roll Number is required').notEmpty().trim(),
  check('phone', 'Valid mobile number is required').notEmpty().isMobilePhone('any'),
  check('department', 'Department is required').notEmpty().trim(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
];

const loginValidationRules = [
  check('email', 'Please provide a valid college email').isEmail().normalizeEmail(),
  check('password', 'Password is required').notEmpty(),
];

const lostReportRules = [
  check('title', 'Item title is required').notEmpty().trim(),
  check('category', 'Category is required').notEmpty().trim(),
  check('description', 'Description is required').notEmpty().trim(),
  check('color', 'Color is required').notEmpty().trim(),
  check('location', 'Location is required').notEmpty().trim(),
  check('dateLost', 'Date lost is required').notEmpty().isISO8601(),
];

const foundReportRules = [
  check('title', 'Item title is required').notEmpty().trim(),
  check('category', 'Category is required').notEmpty().trim(),
  check('description', 'Description is required').notEmpty().trim(),
  check('color', 'Color is required').notEmpty().trim(),
  check('location', 'Found location is required').notEmpty().trim(),
  check('dateFound', 'Date found is required').notEmpty().isISO8601(),
  check('currentStorageLocation', 'Storage location is required').notEmpty().trim(),
];

const claimRules = [
  check('itemId', 'Item ID is required').notEmpty().trim(),
  check('itemModel', 'Item model must be LostItem or FoundItem').isIn(['LostItem', 'FoundItem']),
  check('reason', 'Claim reason is required').notEmpty().trim(),
  check('ownershipDetails', 'Ownership verification details are required').notEmpty().trim(),
];

module.exports = {
  validate,
  registerValidationRules,
  loginValidationRules,
  lostReportRules,
  foundReportRules,
  claimRules,
};

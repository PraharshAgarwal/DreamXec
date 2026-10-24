const express = require('express');
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { updateProfileSchema } = require('../user.validation');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.get('/me', userController.getMyProfile);
router.put('/me', validate(updateProfileSchema), userController.updateMyProfile);
router.post('/picture', upload.single('profileImage'), userController.updateProfilePicture);
router.get('/kyc', userController.getMyKyc);
router.post('/kyc', userController.submitKyc);
router.put('/kyc', userController.submitKyc);
router.get('/dpdp-export', userController.exportUserData);
router.post('/dpdp-delete', userController.requestAccountDeletion);
router.post('/dpdp-consent', userController.recordConsent);

module.exports = router;

const { getAllUserService, getUserByIdService, deleteUserProfileService, updateUserProfileByAdminService, deleteUserProfileByAdminService, updateUserProfileService, getUserProfileByIdService } = require('../model/userModel');
const handleResponse = require('../utils/handleResponse');

// Get all users only admin
const getAllUser = async (req, res, next) => {
  try {
    const users = await getAllUserService();

    if(!users) return handleResponse(res, 404, 'No users was found');

    return handleResponse(res, 200, 'User Retrieved Successfully', users);
  } catch (error) {
    console.log('Unable to get all users', error);
    next(error);
  }
}

// Get specific user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const individualUser = await getUserByIdService(id);

    if(!individualUser) return handleResponse(res, 404, `User with ID:${id} is not found`);

    return handleResponse(res, 200, `User with ID:${id} Retrieved Successfully`, individualUser);
  } catch (error) {
    console.log(`Error to get specific user with ID:${id}`, error);
    next(error);
  }
}

// Get user profile by id
const getUserProfileById = async (req, res, next) => {
  try {
    // Get user id from token
    const userId = req.user.id;

    const getUserProfile = await getUserProfileByIdService(userId);

    if(!getUserProfile) return handleResponse(res, 400, `User profile with id:${userId} error to get.`);

    console.log('Profile', getUserProfile);
    // Normalize nullable address fields to empty strings to make frontend simple
    const normalized = {
      name: getUserProfile.name || "",
      email: getUserProfile.email || "",
      role: getUserProfile.role || "",
      street: getUserProfile.street || "",
      city: getUserProfile.city || "",
      country: getUserProfile.country || "",
      phone_number: getUserProfile.phone_number || ""
    };
    return handleResponse(res, 200, `User profile with id:${userId} get successful.`, normalized);
  } catch (error) {
    console.log('Unable to get user profile ', error);
    next(error);
  }
}

// Update profile only available for admin
const updateUserProfileByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const adminUpdatedProfile = await updateUserProfileByAdminService(id, name, email, password, role);

    if(!adminUpdatedProfile) return handleResponse(res, 404, `Admin error to updating profile with ID:${id}`);
    console.log(`Admin is updated user profile successful with ID:${id}`);
    return handleResponse(res, 200, `Admin updated profile successful`, adminUpdatedProfile);

  } catch (error) {
    console.log('Admin error to updating profile', error);
    next(error);
  }
}
// Deactivate profile only available for admin
const deleteUserProfileByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Admin Received ID:', id);
    const adminDeletedProfile = await deleteUserProfileByAdminService(id);

    if(!adminDeletedProfile) return handleResponse(res, 404, `Admin error to deleting user profile with ID:${id}`);

    console.log(`Admin is deleted user profile successful with ID:${id}`);
    return handleResponse(res, 200, 'Admin deactivated user profile successful', adminDeletedProfile);
  } catch (error) {
    console.log('Error to deactivating user profile', error);
    next(error);
  } 
}
// update profile for normal user
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Received id from jwt token
    console.log(`User ID Received from token-`, userId);
    const { name, email, password } = req.body;
    console.log('Req body ',req.body);
    const updatedProfile = await updateUserProfileService(userId, name, email, password);

    if(!updatedProfile) return handleResponse(res, 400, 'Unable to updating profile');

    return handleResponse(res, 200, 'Profile updated successful', {id: updatedProfile.id, name: updatedProfile.name, email: updatedProfile.email, updated_at: updatedProfile.updated_at});
  } catch (error) {
    console.log('Error to updating profile', error);
    next(error);
  }
}
// delete profile for normal user
const deleteUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Received id from jwt token
    const deletedProfile = await deleteUserProfileService(userId);

    if(!deletedProfile) return handleResponse(res, 404, 'Unable to deactivating profile');

    return handleResponse(res, 200, 'Profile is deactivated succesful');
  } catch (error) {
    console.log('Error to deactivate profile', error);
    next(error);
  }
}



module.exports = {
  getAllUser,
  getUserById,
  updateUserProfileByAdmin,
  deleteUserProfileByAdmin,
  updateUserProfile,
  deleteUserProfile,
  getUserProfileById
};
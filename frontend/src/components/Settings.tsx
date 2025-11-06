import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userApi, getFileUrl } from '../services/api';

interface UserProfile {
  UserID: number;
  Username: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Email: string;
  UserType: string;
  DateJoined: string;
  Country: string;
  City: string | null;
  AccountStatus: string;
  IsOnline: number;
  LastLogin: string | null;
  ProfilePicture: string | null;
}

interface FormErrors {
  [key: string]: string;
}

function Settings() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    Username: '',
    FirstName: '',
    LastName: '',
    Email: '',
    Country: '',
    City: '',
    DateOfBirth: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user?.userId) {
      fetchUserProfile();
    }
  }, [user?.userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getById(user!.userId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }
      
      const data = await response.json();
      setProfile(data.user);
      setFormData({
        Username: data.user.Username,
        FirstName: data.user.FirstName,
        LastName: data.user.LastName,
        Email: data.user.Email,
        Country: data.user.Country,
        City: data.user.City || '',
        DateOfBirth: data.user.DateOfBirth
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.Username.trim()) {
      errors.Username = 'Username is required';
    }
    
    if (!formData.FirstName.trim()) {
      errors.FirstName = 'First name is required';
    }
    
    if (!formData.LastName.trim()) {
      errors.LastName = 'Last name is required';
    }
    
    if (!formData.Email.trim()) {
      errors.Email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      errors.Email = 'Invalid email format';
    }
    
    if (!formData.Country.trim()) {
      errors.Country = 'Country is required';
    }
    
    if (!formData.DateOfBirth) {
      errors.DateOfBirth = 'Date of birth is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await userApi.update(user!.userId, formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const data = await response.json();
      setProfile(data.user);
      
      login({
        userId: data.user.UserID,
        username: data.user.Username,
        userType: data.user.UserType,
        firstName: data.user.FirstName,
        lastName: data.user.LastName,
        profilePicture: data.user.ProfilePicture
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        Username: profile.Username,
        FirstName: profile.FirstName,
        LastName: profile.LastName,
        Email: profile.Email,
        Country: profile.Country,
        City: profile.City || '',
        DateOfBirth: profile.DateOfBirth
      });
    }
    setFormErrors({});
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold">Error loading profile</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchUserProfile}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Account Settings</h2>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSave}>
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  {profile?.ProfilePicture ? (
                    <img
                      src={getFileUrl(profile.ProfilePicture)}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-red-700">
                      {profile?.FirstName[0]}{profile?.LastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile?.FirstName} {profile?.LastName}
                  </h3>
                  <p className="text-gray-600">@{profile?.Username}</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {profile?.UserType}
                  </span>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6 space-y-6">
            {/* Account Information Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="Username"
                    value={formData.Username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.Username ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.Username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.Username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.Email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.Email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.Email}</p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="FirstName"
                    value={formData.FirstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.FirstName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.FirstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.FirstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="LastName"
                    value={formData.LastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.LastName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.LastName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.LastName}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="DateOfBirth"
                    value={formData.DateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.DateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.DateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.DateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="Country"
                    value={formData.Country}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    } ${formErrors.Country ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.Country && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.Country}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="City"
                    value={formData.City}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Settings;


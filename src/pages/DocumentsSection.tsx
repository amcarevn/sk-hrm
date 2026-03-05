import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import onboardingService from '../services/onboarding.service';

// ============================================
// TYPE DEFINITIONS
// ============================================

type OnboardingDocument = {
  id: number;
  document_name: string;
  document_type: 'CONTRACT' | 'REGULATION' | 'HANDBOOK' | 'FORM' | 'TRAINING' | 'SAFETY' | 'POLICY' | 'OTHER';
  description: string;
  file: string;
  is_required: boolean;
  requires_signature: boolean;
  is_read: boolean;
  is_signed: boolean;
  signed_at: string | null;
  signature_file: string | null;
  uploaded_at: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  template_source?: number | null;
  template_source_name?: string | null;
};

type DocumentTemplate = {
  id: number;
  template_name: string;
  document_type: string;
  document_type_display: string;
  description: string;
  file: string;
  is_required: boolean;
  requires_signature: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  created_by_name: string | null;
};

type DocumentsSectionProps = {
  documents: OnboardingDocument[];
  onboardingId: number;
  onUpdate: () => void;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const showError = (msg: string) => window.alert(msg);
const showSuccess = (msg: string) => window.alert(msg);

const getDocumentTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    CONTRACT: 'Hợp đồng',
    REGULATION: 'Nội quy',
    HANDBOOK: 'Sổ tay nhân viên',
    FORM: 'Mẫu biểu',
    TRAINING: 'Tài liệu đào tạo',
    SAFETY: 'An toàn lao động',
    POLICY: 'Chính sách công ty',
    OTHER: 'Khác',
  };
  return types[type] || type;
};

const getDocumentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    CONTRACT: 'bg-blue-50 text-blue-700 border-blue-200',
    REGULATION: 'bg-purple-50 text-purple-700 border-purple-200',
    HANDBOOK: 'bg-green-50 text-green-700 border-green-200',
    FORM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    TRAINING: 'bg-orange-50 text-orange-700 border-orange-200',
    SAFETY: 'bg-red-50 text-red-700 border-red-200',
    POLICY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return colors[type] || colors.OTHER;
};

const DOCUMENT_TYPES = [
  { value: 'CONTRACT', label: 'Hợp đồng' },
  { value: 'REGULATION', label: 'Nội quy' },
  { value: 'HANDBOOK', label: 'Sổ tay nhân viên' },
  { value: 'FORM', label: 'Mẫu biểu' },
  { value: 'TRAINING', label: 'Tài liệu đào tạo' },
  { value: 'SAFETY', label: 'An toàn lao động' },
  { value: 'POLICY', label: 'Chính sách công ty' },
  { value: 'OTHER', label: 'Khác' },
];

// ============================================
// MAIN COMPONENT
// ============================================

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  onboardingId,
  onUpdate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'template' | 'upload'>('template');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    template_name: '',
    document_type: 'OTHER' as DocumentTemplate['document_type'],
    description: '',
    is_required: false,
    requires_signature: false,
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  // ============================================
  // API CALLS
  // ============================================

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await onboardingService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('FETCH TEMPLATES ERROR:', error);
      showError('Không thể tải danh sách template');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleApplyTemplates = async () => {
    if (selectedTemplates.length === 0) {
      showError('Vui lòng chọn ít nhất một template');
      return;
    }

    setApplying(true);

    try {
      const result = await onboardingService.bulkApplyTemplates(onboardingId, selectedTemplates);

      if (!result.success) {
        showError(result.message || 'Không thể áp dụng template');
        return;
      }

      showSuccess(result.message || 'Đã thêm tài liệu thành công');
      setShowModal(false);
      setSelectedTemplates([]);
      onUpdate();
    } catch (error) {
      console.error('APPLY TEMPLATES ERROR:', error);
      showError('Không thể áp dụng template');
    } finally {
      setApplying(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!uploadForm.template_name.trim()) {
      showError('Vui lòng nhập tên tài liệu');
      return;
    }

    if (!uploadForm.file) {
      showError('Vui lòng chọn file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('template_name', uploadForm.template_name);
      formData.append('document_type', uploadForm.document_type);
      formData.append('description', uploadForm.description);
      formData.append('is_required', String(uploadForm.is_required));
      formData.append('requires_signature', String(uploadForm.requires_signature));
      formData.append('is_active', 'true');
      formData.append('apply_to_all_new_onboarding', 'false');
      formData.append('file', uploadForm.file);

      const newTemplate = await onboardingService.createTemplate(formData);

      // Tự động apply template vừa tạo vào onboarding này
      await onboardingService.bulkApplyTemplates(onboardingId, [newTemplate.id]);

      showSuccess('Tạo và thêm tài liệu thành công');
      setShowModal(false);
      resetUploadForm();
      onUpdate();
      fetchTemplates();
    } catch (error: any) {
      console.error('CREATE TEMPLATE ERROR:', error);
      showError(error.response?.data?.message || 'Không thể tạo tài liệu');
    } finally {
      setUploading(false);
    }
  };


  const handleMarkAsRead = async (documentId: number) => {
    try {
      const result = await onboardingService.markDocumentAsRead(documentId);

      if (!result.success) {
        showError(result.message || 'Không thể đánh dấu đã đọc');
        return;
      }

      showSuccess(result.message || 'Đã đánh dấu tài liệu là đã đọc');
      onUpdate();
    } catch (error: any) {
      console.error('MARK READ ERROR:', error);
      showError(error.response?.data?.message || 'Không thể đánh dấu đã đọc');
    }
  };

  const handleSignDocument = async (documentId: number) => {
    if (!confirm('Bạn có chắc muốn ký tài liệu này?')) return;

    try {
      await onboardingService.signDocument(documentId);
      showSuccess('Đã ký tài liệu thành công');
      onUpdate();
    } catch (error: any) {
      console.error('SIGN DOCUMENT ERROR:', error);
      showError(error.response?.data?.message || 'Không thể ký tài liệu');
    }
  };

  const handleViewDocument = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const toggleTemplateSelection = (templateId: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      template_name: '',
      document_type: 'OTHER',
      description: '',
      is_required: false,
      requires_signature: false,
      file: null,
    });
  };

  useEffect(() => {
    if (showModal && modalMode === 'template') {
      fetchTemplates();
    }
  }, [showModal, modalMode]);

  // Filter templates based on search and type
  const filteredTemplates = templates.filter((template) => {
    if (!template.is_active) return false;

    const matchesSearch =
      template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || template.document_type === filterType;

    // Don't show templates that are already applied
    const alreadyApplied = documents.some(
      (doc) => doc.template_source === template.id
    );

    return matchesSearch && matchesType && !alreadyApplied;
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            Tài liệu Onboarding
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý tài liệu từ thư viện template chung
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setModalMode('template');
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
        >
          <SparklesIcon className="w-5 h-5" />
          Thêm từ Template
        </button>
      </div>

      {/* Documents List */}
      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        {doc.document_name}
                        {doc.is_required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            Bắt buộc
                          </span>
                        )}
                      </h4>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                            doc.document_type
                          )}`}
                        >
                          {getDocumentTypeLabel(doc.document_type)}
                        </span>

                        {doc.template_source && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            <SparklesIcon className="w-3 h-3" />
                            Template
                          </span>
                        )}

                        {doc.is_read && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircleIcon className="w-3 h-3" />
                            Đã đọc
                          </span>
                        )}

                        {doc.is_signed && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            <PencilSquareIcon className="w-3 h-3" />
                            Đã ký
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Tải lên bởi:{' '}
                          <span className="font-medium text-gray-700">
                            {doc.uploaded_by_name || 'N/A'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploaded_at).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Signed info */}
                      {doc.is_signed && doc.signed_at && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            ✍️ Đã ký vào lúc:{' '}
                            {new Date(doc.signed_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewDocument(doc.file)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Xem
                  </button>

                  {!doc.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(doc.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Đã đọc
                    </button>
                  )}

                  {doc.requires_signature && !doc.is_signed && (
                    <button
                      onClick={() => handleSignDocument(doc.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Ký
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có tài liệu nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu bằng cách thêm tài liệu từ thư viện template
          </p>
          <button
            onClick={() => {
              setShowModal(true);
              setModalMode('template');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <SparklesIcon className="w-5 h-5" />
            Thêm từ Template
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="w-7 h-7 text-blue-600" />
                  Thêm Tài Liệu
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chọn từ thư viện hoặc tạo tài liệu mới
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTemplates([]);
                  setSearchQuery('');
                  setFilterType('ALL');
                  resetUploadForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-6 pt-4 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setModalMode('template')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${modalMode === 'template'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  📚 Chọn từ Thư viện Template
                </button>
                <button
                  onClick={() => setModalMode('upload')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${modalMode === 'upload'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  ➕ Tạo Tài Liệu Mới
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {modalMode === 'template' ? (
              <>
                {/* Search and Filter */}
                <div className="p-6 border-b border-gray-200 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm template..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                      >
                        <option value="ALL">Tất cả loại</option>
                        {DOCUMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedTemplates.length > 0 && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-blue-900">
                        Đã chọn {selectedTemplates.length} template
                      </span>
                      <button
                        onClick={() => setSelectedTemplates([])}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  )}
                </div>

                {/* Templates List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải template...</p>
                      </div>
                    </div>
                  ) : filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTemplates.map((template) => {
                        const isSelected = selectedTemplates.includes(template.id);
                        return (
                          <div
                            key={template.id}
                            onClick={() => toggleTemplateSelection(template.id)}
                            className={`
                              cursor-pointer border-2 rounded-xl p-5 transition-all duration-200
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                                ${isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300 bg-white'
                                  }
                              `}
                              >
                                {isSelected && (
                                  <CheckCircleIcon className="w-4 h-4 text-white" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {template.template_name}
                                  {template.is_required && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                      Bắt buộc
                                    </span>
                                  )}
                                </h4>

                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                                      template.document_type
                                    )}`}
                                  >
                                    {template.document_type_display}
                                  </span>

                                  {template.requires_signature && (
                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                                      Yêu cầu ký
                                    </span>
                                  )}
                                </div>

                                {template.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {template.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>📊 {template.usage_count} lần dùng</span>
                                  {template.created_by_name && (
                                    <>
                                      <span>•</span>
                                      <span>👤 {template.created_by_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Không tìm thấy template nào</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery || filterType !== 'ALL'
                          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                          : 'Tất cả template đã được thêm hoặc chưa có template nào'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center gap-4 p-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredTemplates.length} template khả dụng
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedTemplates([]);
                      }}
                      disabled={applying}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleApplyTemplates}
                      disabled={applying || selectedTemplates.length === 0}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {applying && (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      )}
                      {applying
                        ? 'Đang thêm...'
                        : `Thêm tài liệu ${selectedTemplates.length > 0 ? `(${selectedTemplates.length})` : ''}`}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Upload Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên Tài Liệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.template_name}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, template_name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập tên tài liệu..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại Tài Liệu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadForm.document_type}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, document_type: e.target.value as any })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mô Tả
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mô tả chi tiết về tài liệu..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      File Tài Liệu <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                          Click để chọn file hoặc kéo thả file vào đây
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, XLS, XLSX
                        </p>
                      </label>
                      {uploadForm.file && (
                        <div className="mt-4 text-sm text-blue-600 font-medium">
                          ✓ Đã chọn: {uploadForm.file.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={uploadForm.is_required}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, is_required: e.target.checked })
                        }
                        className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Bắt buộc</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Nhân viên phải hoàn thành tài liệu này
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={uploadForm.requires_signature}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, requires_signature: e.target.checked })
                        }
                        className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Yêu cầu ký</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tài liệu cần được ký xác nhận
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Lưu ý:</strong> Tài liệu sẽ được lưu vào thư viện template và có thể dùng lại cho nhân viên khác
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetUploadForm();
                    }}
                    disabled={uploading}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={uploading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 shadow-sm"
                  >
                    {uploading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                    {uploading ? 'Đang tạo...' : 'Tạo và Thêm Tài Liệu'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
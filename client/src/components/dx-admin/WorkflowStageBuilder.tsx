import React from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';

interface WorkflowStageBuilderProps {
  stage: any;
  onChange: (updatedStage: any) => void;
}

const PRESET_FORMATS = [
  { id: 'pdf', label: 'PDF Documents', ext: '.pdf', mime: 'application/pdf', icon: '📄' },
  { id: 'image', label: 'Images (JPG, PNG, WEBP)', ext: '.jpg,.jpeg,.png,.webp', mime: 'image/*', icon: '🖼️' },
  { id: 'doc', label: 'Word (DOC, DOCX)', ext: '.doc,.docx', mime: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: '📝' },
  { id: 'excel', label: 'Spreadsheets (XLS, CSV)', ext: '.xls,.xlsx,.csv', mime: '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv', icon: '📊' },
];

export const FileFormatMultiSelect: React.FC<{
  value: string;
  onChange: (newAccept: string) => void;
}> = ({ value = 'application/pdf,image/*', onChange }) => {
  const currentVal = (value || '').toLowerCase();

  const isPdfSelected = currentVal.includes('pdf') || currentVal.includes('.pdf');
  const isImageSelected = currentVal.includes('image') || currentVal.includes('png') || currentVal.includes('jpg') || currentVal.includes('jpeg');
  const isDocSelected = currentVal.includes('doc') || currentVal.includes('word') || currentVal.includes('.docx');
  const isExcelSelected = currentVal.includes('xls') || currentVal.includes('sheet') || currentVal.includes('.csv');

  const togglePreset = (presetId: string) => {
    let nextPdfs = isPdfSelected;
    let nextImages = isImageSelected;
    let nextDocs = isDocSelected;
    let nextExcels = isExcelSelected;

    if (presetId === 'pdf') nextPdfs = !nextPdfs;
    if (presetId === 'image') nextImages = !nextImages;
    if (presetId === 'doc') nextDocs = !nextDocs;
    if (presetId === 'excel') nextExcels = !nextExcels;

    const parts: string[] = [];
    if (nextPdfs) parts.push('application/pdf');
    if (nextImages) parts.push('image/*');
    if (nextDocs) parts.push('.doc,.docx');
    if (nextExcels) parts.push('.xls,.xlsx,.csv');

    onChange(parts.length > 0 ? parts.join(',') : 'application/pdf,image/*');
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block">
        Allowed File Formats (Click to toggle one or more)
      </label>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_FORMATS.map((p) => {
          const isSelected =
            p.id === 'pdf'
              ? isPdfSelected
              : p.id === 'image'
              ? isImageSelected
              : p.id === 'doc'
              ? isDocSelected
              : isExcelSelected;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePreset(p.id)}
              className={`px-2.5 py-1 text-xs font-headline font-bold flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                  : 'bg-white text-[#121316] border-gray-300 hover:border-[#121316]'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {isSelected && <span className="font-black text-xs text-[#9EFC5F]">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-mono">
        <span className="font-bold text-[#0F534A]">MIME Filter:</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. application/pdf,image/*"
          className="bg-white border border-[#121316] px-2 py-0.5 text-[10px] font-mono text-[#121316] flex-1 focus:outline-none focus:border-[#FE4E1A]"
        />
      </div>
    </div>
  );
};

export default function WorkflowStageBuilder({ stage, onChange }: WorkflowStageBuilderProps) {
  const config = stage.config || {};

  const updateConfig = (newConfig: any) => {
    onChange({ ...stage, config: { ...config, ...newConfig } });
  };

  // ─────────────────────────────────────────────
  // 1. FORM STAGE CONFIGURATION
  // ─────────────────────────────────────────────
  if (stage.stageType === 'FORM') {
    const rawFields = Array.isArray(config.fields) ? config.fields : [];
    const fields = rawFields.map((f: any, i: number) => ({
      ...f,
      _uid: f._uid || `f_${i}_${f.id || Date.now()}`,
    }));

    const addField = () => {
      const ts = Date.now();
      const newField = {
        _uid: `field_uid_${ts}`,
        id: `field_${ts.toString().slice(-4)}`,
        type: 'text',
        label: 'New Field',
        placeholder: '',
        required: true,
        helpText: '',
        options: [],
      };
      updateConfig({ fields: [...rawFields, newField] });
    };

    const updateField = (idx: number, updates: any) => {
      const updated = [...rawFields];
      updated[idx] = { ...updated[idx], ...updates };
      updateConfig({ fields: updated });
    };

    const removeField = (idx: number) => {
      const updated = [...rawFields];
      updated.splice(idx, 1);
      updateConfig({ fields: updated });
    };

    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h5 className="font-headline font-black text-xs uppercase text-[#0F534A]">
              Dynamic Form Fields Builder
            </h5>
            <p className="text-[11px] text-gray-500 font-medium">
              Define the inputs applicants must fill in when submitting this stage.
            </p>
          </div>
          <button
            type="button"
            onClick={addField}
            className="text-xs bg-[#0F534A] hover:bg-[#FE4E1A] text-white px-3 py-1.5 font-headline font-black uppercase tracking-wider border-2 border-[#121316] flex items-center gap-1 cursor-pointer transition shadow-[2px_2px_0_#121316]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500 italic bg-white border border-dashed border-gray-300">
            No form fields added yet. Click "+ Add Field" above to add your inputs one by one.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((f: any, i: number) => (
              <div key={f._uid || `field_${i}`} className="bg-white p-3.5 border-2 border-[#121316] space-y-3 shadow-[1px_1px_0_#121316]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-headline font-black text-[#0F534A]">
                        Field Identifier (Key) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[9px] font-mono text-gray-400">key: {f.id || '...'}</span>
                    </div>
                    <input
                      type="text"
                      value={f.id || ''}
                      onChange={(e) => updateField(i, { id: e.target.value })}
                      onBlur={(e) => {
                        const clean = (e.target.value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        if (clean && clean !== f.id) {
                          updateField(i, { id: clean });
                        }
                      }}
                      placeholder="e.g. employee_code"
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
                      Field Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={f.label || ''}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        const updates: any = { label: newLabel };
                        // Auto-derive key if current key is empty or default generated
                        if (!f.id || f.id.startsWith('field_') || f.id === '') {
                          const suggested = newLabel
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_+|_+$/g, '');
                          if (suggested) updates.id = suggested;
                        }
                        updateField(i, updates);
                      }}
                      placeholder="e.g. Official Employee Code"
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-bold focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
                      Input Type
                    </label>
                    <select
                      value={f.type || 'text'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const updates: any = { type: newType };
                        if (newType === 'apaar') {
                          if (!f.label || f.label === 'New Field') updates.label = 'DigiLocker / APAAR ID';
                          if (!f.placeholder) updates.placeholder = '1234-5678-9012';
                          if (!f.helpText) updates.helpText = '12-digit One Nation One Student ID verified against Government API Setu';
                          updates.id = 'apaarId';
                        } else if (newType === 'orcid') {
                          if (!f.label || f.label === 'New Field') updates.label = 'Researcher ORCID iD';
                          if (!f.placeholder) updates.placeholder = '0000-0002-1825-0097';
                          if (!f.helpText) updates.helpText = '16-digit ORCID identifier verified against official ORCID registry';
                          updates.id = 'orcidId';
                        }
                        updateField(i, updates);
                      }}
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-headline font-black focus:outline-none cursor-pointer"
                    >
                      <option value="text">Text Input</option>
                      <option value="apaar">APAAR ID (Govt DigiLocker / API Setu)</option>
                      <option value="orcid">ORCID iD (Researcher Registry)</option>
                      <option value="email">Email Input</option>
                      <option value="number">Number Input</option>
                      <option value="date">Date Picker</option>
                      <option value="select">Dropdown Select</option>
                      <option value="file">File Attachment</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-gray-500 block mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={f.placeholder || ''}
                      onChange={(e) => updateField(i, { placeholder: e.target.value })}
                      placeholder="e.g. Enter code..."
                      className="w-full bg-[#FCFBF7] border border-gray-300 p-1.5 text-xs focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-gray-500 block mb-1">
                      Helper / Guidance Text
                    </label>
                    <input
                      type="text"
                      value={f.helpText || ''}
                      onChange={(e) => updateField(i, { helpText: e.target.value })}
                      placeholder="e.g. As shown on faculty card"
                      className="w-full bg-[#FCFBF7] border border-gray-300 p-1.5 text-xs focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <label className="text-xs font-headline font-black text-[#0F534A] flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(f.required)}
                        onChange={(e) => updateField(i, { required: e.target.checked })}
                        className="w-4 h-4 accent-[#FE4E1A] cursor-pointer"
                      />
                      Required
                    </label>

                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="p-1.5 border border-[#121316] bg-white text-gray-500 hover:text-red-600 transition cursor-pointer"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {f.type === 'select' && (
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
                      Select Options (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(f.options) ? f.options.join(', ') : f.options || ''}
                      onChange={(e) =>
                        updateField(i, {
                          options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Assistant Professor, Associate Professor, Dean"
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-medium focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>
                )}

                {f.type === 'file' && (
                  <div className="pt-2 border-t border-gray-100">
                    <FileFormatMultiSelect
                      value={f.accept || 'application/pdf,image/*'}
                      onChange={(newAccept) => updateField(i, { accept: newAccept })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 2. DOCUMENT UPLOAD STAGE CONFIGURATION
  // ─────────────────────────────────────────────
  if (stage.stageType === 'DOCUMENT_UPLOAD') {
    // Backend uiSchema & controllers read config.requiredDocuments
    const rawDocs = Array.isArray(config.requiredDocuments)
      ? config.requiredDocuments
      : Array.isArray(config.expectedDocuments)
      ? config.expectedDocuments
      : [];

    const docs = rawDocs.map((d: any, i: number) => ({
      ...d,
      _uid: d._uid || `doc_${i}_${d.id || Date.now()}`,
    }));

    const addDoc = () => {
      const ts = Date.now();
      const newDoc = {
        _uid: `doc_uid_${ts}`,
        id: `doc_${ts.toString().slice(-4)}`,
        name: 'Verification Document',
        description: 'Upload clear scanned copy or PDF',
        accept: 'application/pdf,image/*',
        maxSizeMB: 5,
        required: true,
      };
      updateConfig({ requiredDocuments: [...rawDocs, newDoc] });
    };

    const updateDoc = (idx: number, updates: any) => {
      const updated = [...rawDocs];
      updated[idx] = { ...updated[idx], ...updates };
      updateConfig({ requiredDocuments: updated });
    };

    const removeDoc = (idx: number) => {
      const updated = [...rawDocs];
      updated.splice(idx, 1);
      updateConfig({ requiredDocuments: updated });
    };

    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h5 className="font-headline font-black text-xs uppercase text-[#0F534A]">
              Required Documents Configuration
            </h5>
            <p className="text-[11px] text-gray-500 font-medium">
              Specify institutional certificates, identity cards, or letters required for verification.
            </p>
          </div>
          <button
            type="button"
            onClick={addDoc}
            className="text-xs bg-[#0F534A] hover:bg-[#FE4E1A] text-white px-3 py-1.5 font-headline font-black uppercase tracking-wider border-2 border-[#121316] flex items-center gap-1 cursor-pointer transition shadow-[2px_2px_0_#121316]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        </div>

        {docs.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500 italic bg-white border border-dashed border-gray-300">
            No documents configured yet. Click "+ Add Document" above to specify required upload documents one by one.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d: any, i: number) => (
              <div key={d._uid || `doc_${i}`} className="bg-white p-3.5 border-2 border-[#121316] space-y-3 shadow-[1px_1px_0_#121316]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-headline font-black text-[#0F534A]">
                        Document Identifier (Key) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[9px] font-mono text-gray-400">key: {d.id || '...'}</span>
                    </div>
                    <input
                      type="text"
                      value={d.id || ''}
                      onChange={(e) => updateDoc(i, { id: e.target.value })}
                      onBlur={(e) => {
                        const clean = (e.target.value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        if (clean && clean !== d.id) {
                          updateDoc(i, { id: clean });
                        }
                      }}
                      placeholder="e.g. id_proof"
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
                      Document Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={d.name || d.title || ''}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const updates: any = { name: newName, title: newName };
                        if (!d.id || d.id.startsWith('doc_') || d.id === '') {
                          const suggested = newName
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_+|_+$/g, '');
                          if (suggested) updates.id = suggested;
                        }
                        updateDoc(i, updates);
                      }}
                      placeholder="e.g. Institutional Appointment Letter"
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-bold focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
                      Max Size (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={d.maxSizeMB || 5}
                      onChange={(e) => updateDoc(i, { maxSizeMB: Number(e.target.value) || 5 })}
                      className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-bold focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>
                </div>

                {/* Easy Multi-Select Allowed File Formats */}
                <div className="pt-2 border-t border-gray-100">
                  <FileFormatMultiSelect
                    value={d.accept || 'application/pdf,image/*'}
                    onChange={(newAccept) => updateDoc(i, { accept: newAccept })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex-1 pr-4">
                    <label className="text-[10px] uppercase font-headline font-black text-gray-500 block mb-1">
                      Upload Instructions / Description
                    </label>
                    <input
                      type="text"
                      value={d.description || ''}
                      onChange={(e) => updateDoc(i, { description: e.target.value })}
                      placeholder="e.g. Scanned copy with official seal"
                      className="w-full bg-[#FCFBF7] border border-gray-300 p-1.5 text-xs focus:outline-none focus:border-[#FE4E1A]"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-3">
                    <label className="text-xs font-headline font-black text-[#0F534A] flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.required !== false}
                        onChange={(e) => updateDoc(i, { required: e.target.checked })}
                        className="w-4 h-4 accent-[#FE4E1A] cursor-pointer"
                      />
                      Mandatory
                    </label>

                    <button
                      type="button"
                      onClick={() => removeDoc(i)}
                      className="p-1.5 border border-[#121316] bg-white text-gray-500 hover:text-red-600 transition cursor-pointer"
                      title="Remove document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 3. EMAIL VERIFICATION STAGE CONFIGURATION
  // ─────────────────────────────────────────────
  if (stage.stageType === 'EMAIL_VERIFICATION') {
    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="pb-2 border-b border-gray-200">
          <h5 className="font-headline font-black text-xs uppercase text-[#0F534A]">
            Academic &amp; Corporate Email Verification Constraints
          </h5>
          <p className="text-[11px] text-gray-500 font-medium">
            Ensure applicants verify their official institutional mailbox before proceeding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              Required Domain Suffix (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. iitd.ac.in or mit.edu"
              value={config.requiredDomain || ''}
              onChange={(e) => updateConfig({ requiredDomain: e.target.value.trim().toLowerCase() })}
              className="w-full bg-white border-2 border-[#121316] p-2 text-xs font-mono font-bold focus:outline-none focus:border-[#FE4E1A]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              Email Field Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. academicEmail"
              value={config.emailField || 'academicEmail'}
              onChange={(e) => updateConfig({ emailField: e.target.value.trim() })}
              className="w-full bg-white border-2 border-[#121316] p-2 text-xs font-mono font-bold focus:outline-none focus:border-[#FE4E1A]"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="text-xs font-headline font-black text-[#0F534A] flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(config.allowPersonalEmail)}
              onChange={(e) => updateConfig({ allowPersonalEmail: e.target.checked })}
              className="w-4 h-4 accent-[#FE4E1A] cursor-pointer"
            />
            Allow Personal Email Providers (gmail.com, yahoo.com) if institutional email is unavailable
          </label>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 5. APAAR ID (DIGILOCKER / API SETU) STAGE CONFIGURATION
  // ─────────────────────────────────────────────
  if (stage.stageType === 'APAAR_VERIFICATION') {
    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h5 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5">
              <span>🇮🇳</span> APAAR / DigiLocker Verification Configuration
            </h5>
            <p className="text-[11px] text-gray-500 font-medium">
              Real-time student identification via Government API Setu and DigiLocker ABC repository.
            </p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-black bg-[#0F534A] text-white uppercase tracking-wider border border-[#121316]">
            API SETU LIVE
          </span>
        </div>

        <div className="p-3 bg-[#0F534A]/10 border-2 border-[#0F534A] space-y-1.5">
          <p className="text-xs font-bold text-[#0F534A]">
            ✓ Automated 12-Digit One Nation One Student ID Verification
          </p>
          <p className="text-[11px] text-[#121316]/80 leading-relaxed">
            When students reach this stage, they are prompted for their 12-digit APAAR ID. DreamX connects directly to the official DigiLocker ABC registry to verify active enrollment status, institutional affiliation, and academic credit score.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              Field Key
            </label>
            <input
              type="text"
              value={config.fieldId || 'apaarId'}
              onChange={(e) => updateConfig({ fieldId: e.target.value })}
              className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              Portal Guidance Link
            </label>
            <input
              type="text"
              disabled
              value="https://apaar.education.gov.in"
              className="w-full bg-gray-100 border border-gray-300 p-1.5 text-xs font-mono text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="text-xs font-headline font-black text-[#0F534A] flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.required !== false}
              onChange={(e) => updateConfig({ required: e.target.checked })}
              className="w-4 h-4 accent-[#0F534A] cursor-pointer"
            />
            Strict Verification Required (Applicant cannot advance to next stage without verifying APAAR)
          </label>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 6. ORCID REGISTRY (RESEARCHER) STAGE CONFIGURATION
  // ─────────────────────────────────────────────
  if (stage.stageType === 'ORCID_VERIFICATION') {
    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h5 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5">
              <span>🔬</span> ORCID Researcher Registry Configuration
            </h5>
            <p className="text-[11px] text-gray-500 font-medium">
              Real-time researcher identity validation via the official public ORCID API & OAuth registry.
            </p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-black bg-[#18D7E8] text-[#041A16] uppercase tracking-wider border border-[#121316]">
            ORCID.ORG LIVE
          </span>
        </div>

        <div className="p-3 bg-[#18D7E8]/15 border-2 border-[#041A16] space-y-1.5">
          <p className="text-xs font-bold text-[#041A16]">
            ✓ Automated 16-Character Researcher Verification
          </p>
          <p className="text-[11px] text-[#121316]/80 leading-relaxed">
            When researchers reach this stage, they are prompted for their 16-digit ORCID identifier (e.g. 0009-0005-6880-2522). DreamX queries the public registry to verify author credentials, research keywords, and public academic profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              Field Key
            </label>
            <input
              type="text"
              value={config.fieldId || 'orcidId'}
              onChange={(e) => updateConfig({ fieldId: e.target.value })}
              className="w-full bg-[#FCFBF7] border border-[#121316] p-1.5 text-xs font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-headline font-black text-[#0F534A] block mb-1">
              ORCID Registration URL
            </label>
            <input
              type="text"
              disabled
              value="https://orcid.org/register"
              className="w-full bg-gray-100 border border-gray-300 p-1.5 text-xs font-mono text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="text-xs font-headline font-black text-[#0F534A] flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.required !== false}
              onChange={(e) => updateConfig({ required: e.target.checked })}
              className="w-4 h-4 accent-[#0F534A] cursor-pointer"
            />
            Strict Verification Required (Applicant cannot advance without verified ORCID iD)
          </label>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 7. MANUAL REVIEW / COMPLIANCE / APPROVAL STAGES
  // ─────────────────────────────────────────────
  if (['MANUAL_REVIEW', 'COMPLIANCE_REVIEW', 'APPROVAL', 'BACKGROUND_CHECK'].includes(stage.stageType)) {
    const checklist = Array.isArray(config.reviewerChecklist) ? config.reviewerChecklist : [];

    const addItem = () => updateConfig({ reviewerChecklist: [...checklist, 'Verify institutional identity card & authorization letter'] });
    const updateItem = (idx: number, val: string) => {
      const updated = [...checklist];
      updated[idx] = val;
      updateConfig({ reviewerChecklist: updated });
    };
    const removeItem = (idx: number) => {
      const updated = [...checklist];
      updated.splice(idx, 1);
      updateConfig({ reviewerChecklist: updated });
    };

    return (
      <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] space-y-4 shadow-[2px_2px_0_#121316]">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h5 className="font-headline font-black text-xs uppercase text-[#0F534A]">
              DreamX Admin Reviewer Checklist
            </h5>
            <p className="text-[11px] text-gray-500 font-medium">
              Checklist items the DreamX Platform Super Admin will audit before verifying and activating this role.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="text-xs bg-[#0F534A] hover:bg-[#FE4E1A] text-white px-3 py-1.5 font-headline font-black uppercase tracking-wider border-2 border-[#121316] flex items-center gap-1 cursor-pointer transition shadow-[2px_2px_0_#121316]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Checklist Item
          </button>
        </div>

        {/* Locked DreamX Admin Reviewer Authority Badge */}
        <div className="p-3 bg-[#FFDD33]/20 border-2 border-[#121316] flex items-center justify-between shadow-[2px_2px_0_#121316]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="text-[10px] font-black uppercase text-[#0F534A] block tracking-wider">
                Assigned Review Authority
              </span>
              <span className="text-xs font-headline font-black text-[#121316]">
                DreamX Platform Super Admin (Always Enforced)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-black bg-[#0F534A] text-white uppercase tracking-wider border border-[#121316]">
            DREAMX ADMIN ONLY
          </span>
        </div>

        <div className="space-y-2 pt-2">
          {checklist.map((item: string, i: number) => (
            <div key={i} className="flex gap-2.5 items-center bg-white p-2.5 border border-[#121316]">
              <CheckSquare className="w-4 h-4 text-[#0F534A] shrink-0" />
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="Checklist item description..."
                className="flex-1 bg-transparent text-xs font-medium text-[#121316] focus:outline-none border-b border-transparent focus:border-[#FE4E1A]"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                title="Remove checklist item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFBF7] p-4 border-2 border-[#121316] text-xs text-gray-500 font-medium">
      Standard automated progression configured for {stage.stageType}. No additional parameters required.
    </div>
  );
}

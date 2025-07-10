import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import MultiSelect from '../components/MultiSelect';
import { Collapse } from 'react-collapse';
import { useMsal } from '@azure/msal-react';

// Interface for SKU data structure
interface SkuData {
  id: number;
  sku_code: string;
  sku_description: string;
  cm_code: string;
  cm_description: string;
  sku_reference: string;
  is_active: boolean;
  created_by: string;
  created_date: string;
  period: string; // Added period field
  purchased_quantity?: string | number | null;
  dual_source?: string;
  formulation_reference?: string;
}

// Interface for API response
interface ApiResponse {
  success: boolean;
  count: number;
  cm_code: string;
  data: SkuData[];
}

// Add mock component data for table rows (replace with real API data as needed)
const initialComponentRows = [
  {
    id: 1,
    is_active: true,
    material_type: 'Plastic',
    component_reference: 'CR-001',
    component_code: 'C-1001',
    component_description: 'Bottle Cap',
    valid_from: '2023',
    valid_to: '2024',
    material_group: 'Bg-001',
    qtv: 10,
    uom: 'PCS',
    basic_uom: 'PCS',
    packaging_type: 'Primary',
    weight_type: 'Net',
    unit_measure: 'g',
    post_customer: 20,
    post_industrial: 10,
    text1: 'Text 1',
    text2: 'Text 2',
    text3: 'Text 3',
    text4: 'Text 4',
  },
  // Add more rows as needed
];

type AddComponentData = {
  componentType: string;
  componentCode: string;
  componentDescription: string;
  validityFrom: string;
  validityTo: string;
  componentCategory: string;
  componentQuantity: string;
  componentUnitOfMeasure: string;
  componentBaseQuantity: string;
  componentBaseUnitOfMeasure: string;
  wW: string;
  componentPackagingType: string;
  componentPackagingMaterial: string;
  componentUnitWeight: string;
  componentWeightUnitOfMeasure: string;
  percentPostConsumer: string;
  percentPostIndustrial: string;
  percentChemical: string;
  percentBioSourced: string;
  materialStructure: string;
  packagingColour: string;
  packagingLevel: string;
  componentDimensions: string;
};

const CmSkuDetail: React.FC = () => {
  const { cmCode } = useParams();
  const location = useLocation();
  const cmDescription = location.state?.cmDescription || '';
  const status = location.state?.status || '';
  const navigate = useNavigate();

  // State for SKU data
  const [skuData, setSkuData] = useState<SkuData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showSkuModal, setShowSkuModal] = useState(false);

  // New state for open index
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First panel open by default

  // Add mock component data for table rows (replace with real API data as needed)
  const [componentRows, setComponentRows] = useState(initialComponentRows);

  // New state for confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSkuId, setPendingSkuId] = useState<number | null>(null);
  const [pendingSkuStatus, setPendingSkuStatus] = useState<boolean>(false);

  // State for applied filters
  const [appliedFilters, setAppliedFilters] = useState<{ years: string[]; skuDescriptions: string[] }>({ years: [], skuDescriptions: [] });

  // Filtered SKUs based on applied filters
  const filteredSkuData = skuData.filter(sku => {
    // Filter by period (years)
    const yearMatch =
      appliedFilters.years.length === 0 ||
      appliedFilters.years.includes(sku.period);

    // Filter by SKU Description
    const descMatch =
      appliedFilters.skuDescriptions.length === 0 ||
      appliedFilters.skuDescriptions.includes(sku.sku_description);

    return yearMatch && descMatch;
  });

  // Search button handler
  const handleSearch = () => {
    setAppliedFilters({ years: selectedYears, skuDescriptions: selectedSkuDescriptions });
    setOpenIndex(0); // Optionally reset to first panel
  };

  // Reset button handler
  const handleReset = () => {
    setSelectedYears([]);
    setSelectedSkuDescriptions([]);
    setAppliedFilters({ years: [], skuDescriptions: [] });
    setOpenIndex(0);
  };

  const { instance, accounts } = useMsal();

  async function getAccessToken() {
    if (accounts.length === 0) {
      await instance.loginPopup(); // or loginRedirect
    }
    const result = await instance.acquireTokenSilent({
      scopes: ["api://5855622d-af7e-43ca-9266-67919b68fe4a/.default"],
      account: accounts[0]
    });
    return result.accessToken;
  }

  // Expose fetchSkuDetails for use after add/edit
  const fetchSkuDetails = async () => {
    if (!cmCode) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:5000/sku-details/${cmCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      if (result.success) {
        setSkuData(result.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SKU details');
      console.error('Error fetching SKU details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SKU details from API
  useEffect(() => {
    fetchSkuDetails();
    // eslint-disable-next-line
  }, [cmCode]);

  // Fetch years from API
  const [years, setYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('http://localhost:5000/sku-details-active-years');
        if (!response.ok) throw new Error('Failed to fetch years');
        const result = await response.json();
        // Assume result is an array of years or { years: [...] }
        setYears(Array.isArray(result) ? result : result.years || []);
      } catch (err) {
        setYears([]);
      }
    };
    fetchYears();
  }, []);

  // Fetch SKU descriptions from API
  const [skuDescriptions, setSkuDescriptions] = useState<string[]>([]);
  const [selectedSkuDescriptions, setSelectedSkuDescriptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchDescriptions = async () => {
      try {
        const response = await fetch('http://localhost:5000/sku-descriptions');
        if (!response.ok) throw new Error('Failed to fetch descriptions');
        const result = await response.json();
        setSkuDescriptions(result.descriptions || []);
      } catch (err) {
        setSkuDescriptions([]);
      }
    };
    fetchDescriptions();
  }, []);

  // Handler to update is_active status
  const handleIsActiveChange = async (skuId: number, currentStatus: boolean) => {
    try {
      // Optimistically update UI
      setSkuData(prev => prev.map(sku => sku.id === skuId ? { ...sku, is_active: !currentStatus } : sku));
      // Send PATCH request
      const token = await getAccessToken();
      await fetch(`http://localhost:5000/sku-details/${skuId}/is-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
    } catch (err) {
      // If error, revert UI change
      setSkuData(prev => prev.map(sku => sku.id === skuId ? { ...sku, is_active: currentStatus } : sku));
      alert('Failed to update status. Please try again.');
    }
  };

  // Handler for table row/component is_active
  const handleComponentIsActiveChange = (rowId: number, currentStatus: boolean) => {
    setComponentRows(prev => prev.map(row => row.id === rowId ? { ...row, is_active: !currentStatus } : row));
    // Optionally, send PATCH to backend for component/row status here
  };

  // Handler for header button click (show modal)
  const handleHeaderStatusClick = (skuId: number, currentStatus: boolean) => {
    setPendingSkuId(skuId);
    setPendingSkuStatus(currentStatus);
    setShowConfirm(true);
  };

  // Handler for modal confirm
  const handleConfirmStatusChange = async () => {
    if (pendingSkuId !== null) {
      await handleIsActiveChange(pendingSkuId, pendingSkuStatus);
    }
    setShowConfirm(false);
    setPendingSkuId(null);
  };

  // Handler for modal cancel
  const handleCancelStatusChange = () => {
    setShowConfirm(false);
    setPendingSkuId(null);
  };

  // Add state for Add SKU modal fields and validation
  const [addSkuPeriod, setAddSkuPeriod] = useState('');
  const [addSku, setAddSku] = useState('');
  const [addSkuDescription, setAddSkuDescription] = useState('');
  const [addSkuQty, setAddSkuQty] = useState('');
  const [addSkuErrors, setAddSkuErrors] = useState({ sku: '', skuDescription: '', period: '', qty: '', server: '' });
  const [addSkuSuccess, setAddSkuSuccess] = useState('');
  const [addSkuLoading, setAddSkuLoading] = useState(false);

  // Add SKU handler
  const handleAddSkuSave = async () => {
    // Client-side validation
    let errors = { sku: '', skuDescription: '', period: '', qty: '', server: '' };
    if (!addSku.trim()) errors.sku = 'A value is required for SKU code';
    if (!addSkuDescription.trim()) errors.skuDescription = 'A value is required for SKU description';
    if (!addSkuPeriod) errors.period = 'A value is required for the Period';
    if (!addSkuQty || isNaN(Number(addSkuQty)) || Number(addSkuQty) <= 0) errors.qty = 'A value is required for Purchased Quantity';
    setAddSkuErrors(errors);
    setAddSkuSuccess('');
    if (errors.sku || errors.skuDescription || errors.period || errors.qty) return;

    // POST to API
    setAddSkuLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:5000/sku-details/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: addSku,
          sku_description: addSkuDescription,
          period: addSkuPeriod,
          purchased_quantity: addSkuQty, // send as string
          cm_code: cmCode,
          cm_description: cmDescription
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        // Server-side validation error
        setAddSkuErrors({ ...errors, server: result.message || 'Server validation failed' });
        setAddSkuLoading(false);
        return;
      }
      // Success
      setAddSkuSuccess('SKU added successfully!');
      setAddSkuErrors({ sku: '', skuDescription: '', period: '', qty: '', server: '' });
      // Call audit log API
      const auditToken = await getAccessToken();
      await fetch('http://localhost:5000/sku-auditlog/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auditToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: addSku,
          sku_description: addSkuDescription,
          cm_code: cmCode,
          cm_description: cmDescription,
          is_active: true, // assuming new SKUs are active
          created_by: 'system', // or use actual user if available
          created_date: new Date().toISOString()
        })
      });
      setTimeout(async () => {
        setShowSkuModal(false);
        setAddSku('');
        setAddSkuDescription('');
        setAddSkuPeriod('');
        setAddSkuQty('');
        setAddSkuSuccess('');
        setLoading(true); // show full-page loader
        await fetchSkuDetails(); // refresh data
        setLoading(false); // hide loader
      }, 1200);
    } catch (err) {
      setAddSkuErrors({ ...errors, server: 'Network or server error' });
    } finally {
      setAddSkuLoading(false);
    }
  };

  // Edit SKU modal state
  const [showEditSkuModal, setShowEditSkuModal] = useState(false);
  const [editSkuData, setEditSkuData] = useState({
    period: '',
    sku: '',
    skuDescription: '',
    qty: '',
    dualSource: '',
    skuReference: '',
    formulationReference: '',
  });
  const [editSkuErrors, setEditSkuErrors] = useState({ sku: '', skuDescription: '', period: '', qty: '', formulationReference: '', server: '' });
  const [editSkuSuccess, setEditSkuSuccess] = useState('');
  const [editSkuLoading, setEditSkuLoading] = useState(false);

  // Handler to open Edit SKU modal (to be called on Edit SKU button click)
  const handleEditSkuOpen = (sku: SkuData) => {
    setEditSkuData({
      period: sku.period || '',
      sku: sku.sku_code || '',
      skuDescription: sku.sku_description || '',
      qty: sku.purchased_quantity != null ? String(sku.purchased_quantity) : '',
      dualSource: sku.dual_source || '',
      skuReference: sku.sku_reference || '',
      formulationReference: sku.formulation_reference || '',
    });
    setEditSkuErrors({ sku: '', skuDescription: '', period: '', qty: '', formulationReference: '', server: '' });
    setEditSkuSuccess('');
    setShowEditSkuModal(true);
  };

  // Edit SKU handler
  const handleEditSkuUpdate = async () => {
    // Client-side validation
    let errors = { sku: '', skuDescription: '', period: '', qty: '', formulationReference: '', server: '' };
    if (!editSkuData.sku.trim()) errors.sku = 'A value is required for SKU code';
    if (!editSkuData.skuDescription.trim()) errors.skuDescription = 'A value is required for SKU description';
    if (!editSkuData.period) errors.period = 'A value is required for the Period';
    if (!editSkuData.qty || isNaN(Number(editSkuData.qty)) || Number(editSkuData.qty) <= 0) errors.qty = 'A value is required for Purchased Quantity';
    // Formulation Reference is now optional, so no validation
    setEditSkuErrors(errors);
    setEditSkuSuccess('');
    if (errors.sku || errors.skuDescription || errors.period || errors.qty) return;

    // PUT to API
    setEditSkuLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:5000/sku-details/update/${encodeURIComponent(editSkuData.sku)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: editSkuData.sku,
          sku_description: editSkuData.skuDescription,
          period: editSkuData.period,
          purchased_quantity: editSkuData.qty, // send as string
          dual_source: editSkuData.dualSource,
          sku_reference: editSkuData.skuReference,
          formulation_reference: editSkuData.formulationReference
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setEditSkuErrors({ ...errors, server: result.message || 'Server validation failed' });
        setEditSkuLoading(false);
        return;
      }
      setEditSkuSuccess('SKU updated successfully!');
      setEditSkuErrors({ sku: '', skuDescription: '', period: '', qty: '', formulationReference: '', server: '' });
      // Call audit log API
      const auditToken = await getAccessToken();
      await fetch('http://localhost:5000/sku-auditlog/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auditToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: editSkuData.sku,
          sku_description: editSkuData.skuDescription,
          cm_code: cmCode,
          cm_description: cmDescription,
          is_active: true, // or use actual value if available
          created_by: 'system', // or use actual user if available
          created_date: new Date().toISOString()
        })
      });
      setTimeout(async () => {
        setShowEditSkuModal(false);
        setEditSkuSuccess('');
        setLoading(true); // show full-page loader
        await fetchSkuDetails(); // refresh data
        setLoading(false); // hide loader
      }, 1200);
    } catch (err) {
      setEditSkuErrors({ ...errors, server: 'Network or server error' });
    } finally {
      setEditSkuLoading(false);
    }
  };

  // Add Component modal state
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [addComponentData, setAddComponentData] = useState<AddComponentData>({
    componentType: '',
    componentCode: '',
    componentDescription: '',
    validityFrom: '',
    validityTo: '',
    componentCategory: '',
    componentQuantity: '',
    componentUnitOfMeasure: '',
    componentBaseQuantity: '',
    componentBaseUnitOfMeasure: '',
    wW: '',
    componentPackagingType: '',
    componentPackagingMaterial: '',
    componentUnitWeight: '',
    componentWeightUnitOfMeasure: '',
    percentPostConsumer: '',
    percentPostIndustrial: '',
    percentChemical: '',
    percentBioSourced: '',
    materialStructure: '',
    packagingColour: '',
    packagingLevel: '',
    componentDimensions: '',
  });

  // State for evidence upload
  const [evidenceChecks, setEvidenceChecks] = useState<boolean[]>([false, false, false, false]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[][]>([[], [], [], []]);
  const [allEvidenceFiles, setAllEvidenceFiles] = useState<File[]>([]);
  const [selectForAll, setSelectForAll] = useState(false);
  const [uploadEvidenceChecked, setUploadEvidenceChecked] = useState(false);

  // Add state for Add Component modal fields and validation
  const [addComponentErrors, setAddComponentErrors] = useState<Record<string, string>>({});
  const [addComponentSuccess, setAddComponentSuccess] = useState("");

  // Add Component handler
  const handleAddComponentSave = async () => {
    const errors: Record<string, string> = {};
    if (!addComponentData.componentType) errors.componentType = 'A value is required for Component Type';
    if (!addComponentData.componentCode) errors.componentCode = 'A value is required for Component Code';
    if (!addComponentData.componentDescription) errors.componentDescription = 'A value is required for Component Description';
    if (!addComponentData.validityFrom) errors.validityFrom = 'A value is required for Component validity date - From';
    if (!addComponentData.validityTo) errors.validityTo = 'A value is required for Component validity date - To';
    if (!addComponentData.componentQuantity) errors.componentQuantity = 'A value is required for Component Quantity';
    if (!addComponentData.componentUnitOfMeasure) errors.componentUnitOfMeasure = 'A value is required for Unit of Measure';
    if (!addComponentData.componentBaseQuantity) errors.componentBaseQuantity = 'A value is required for Component Base Quantity';
    if (!addComponentData.componentBaseUnitOfMeasure) errors.componentBaseUnitOfMeasure = 'A value is required for Component Base Unit of Measure';
    if (!addComponentData.componentPackagingType) errors.componentPackagingType = 'A value is required for Component Packaging Type';
    if (!addComponentData.componentPackagingMaterial) errors.componentPackagingMaterial = 'A value is required for Component Packaging Material';
    if (!addComponentData.componentUnitWeight) errors.componentUnitWeight = 'A value is required for Component Unit Weight';
    if (!addComponentData.componentWeightUnitOfMeasure) errors.componentWeightUnitOfMeasure = 'A value is required for Component Weight Unit of Measure';

    // Percentage fields
    const percentFields = [
      Number(addComponentData.percentPostConsumer) || 0,
      Number(addComponentData.percentPostIndustrial) || 0,
      Number(addComponentData.percentChemical) || 0,
      Number(addComponentData.percentBioSourced) || 0,
    ];
    percentFields.forEach((val, idx) => {
      if (val > 100) errors[`percent${idx}`] = "This value can't be greater than 100%";
    });
    if (percentFields.reduce((a, b) => a + b, 0) > 100) {
      errors.percentSum = "The sum of the four recycled content values cannot be greater than 100%";
    }

    setAddComponentErrors(errors);
    if (Object.keys(errors).length > 0) return; // Do not close modal if errors

    // POST to API
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:5000/sku-details/add', { // This endpoint is for SKU, not component
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: addSku, // This will be undefined or incorrect
          sku_description: addSkuDescription, // This will be undefined or incorrect
          period: addSkuPeriod, // This will be undefined or incorrect
          purchased_quantity: addSkuQty, // This will be undefined or incorrect
          cm_code: cmCode,
          cm_description: cmDescription,
          component_type: addComponentData.componentType,
          component_code: addComponentData.componentCode,
          component_description: addComponentData.componentDescription,
          validity_from: addComponentData.validityFrom,
          validity_to: addComponentData.validityTo,
          component_category: addComponentData.componentCategory,
          component_quantity: addComponentData.componentQuantity,
          component_unit_of_measure: addComponentData.componentUnitOfMeasure,
          component_base_quantity: addComponentData.componentBaseQuantity,
          component_base_unit_of_measure: addComponentData.componentBaseUnitOfMeasure,
          ww: addComponentData.wW,
          component_packaging_type: addComponentData.componentPackagingType,
          component_packaging_material: addComponentData.componentPackagingMaterial,
          component_unit_weight: addComponentData.componentUnitWeight,
          component_weight_unit_of_measure: addComponentData.componentWeightUnitOfMeasure,
          percent_post_consumer: addComponentData.percentPostConsumer,
          percent_post_industrial: addComponentData.percentPostIndustrial,
          percent_chemical: addComponentData.percentChemical,
          percent_bio_sourced: addComponentData.percentBioSourced,
          material_structure: addComponentData.materialStructure,
          packaging_colour: addComponentData.packagingColour,
          packaging_level: addComponentData.packagingLevel,
          component_dimensions: addComponentData.componentDimensions,
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        // Server-side validation error
        setAddComponentErrors({ ...errors, server: result.message || 'Server validation failed' });
        return;
      }
      // Success
      setAddComponentSuccess('Component added successfully!');
      setAddComponentErrors({}); // Clear errors on success
      // Call audit log API
      const auditToken = await getAccessToken();
      await fetch('http://localhost:5000/sku-auditlog/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auditToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku_code: addSku, // This will be undefined or incorrect
          sku_description: addSkuDescription, // This will be undefined or incorrect
          cm_code: cmCode,
          cm_description: cmDescription,
          is_active: true, // assuming new SKUs are active
          created_by: 'system', // or use actual user if available
          created_date: new Date().toISOString()
        })
      });
      setTimeout(async () => {
        setShowAddComponentModal(false);
        setAddComponentData({
          componentType: '',
          componentCode: '',
          componentDescription: '',
          validityFrom: '',
          validityTo: '',
          componentCategory: '',
          componentQuantity: '',
          componentUnitOfMeasure: '',
          componentBaseQuantity: '',
          componentBaseUnitOfMeasure: '',
          wW: '',
          componentPackagingType: '',
          componentPackagingMaterial: '',
          componentUnitWeight: '',
          componentWeightUnitOfMeasure: '',
          percentPostConsumer: '',
          percentPostIndustrial: '',
          percentChemical: '',
          percentBioSourced: '',
          materialStructure: '',
          packagingColour: '',
          packagingLevel: '',
          componentDimensions: '',
        });
        setAddComponentSuccess('');
        setLoading(true); // show full-page loader
        await fetchSkuDetails(); // refresh data
        setLoading(false); // hide loader
      }, 1200);
    } catch (err) {
      setAddComponentErrors({ ...errors, server: 'Network or server error' });
    } finally {
      // setAddComponentLoading(false); // This line was removed as setAddComponentLoading was not defined
    }
  };

  return (
    <Layout>
      {loading && <Loader />}
      <div className="mainInternalPages" style={{ opacity: loading ? 0.5 : 1 }}>
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#000',
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <i className="ri-arrow-left-line" style={{ fontSize: 24, marginRight: 4 }} />
            Back
          </button>
        </div>
        <div className="commonTitle">
          <div className="icon">
            <i className="ri-file-list-3-fill"></i>
          </div>
          <h1>3PM Detail</h1>
        </div>

        <div className="filters CMDetails">
          <div className="row">
            <div className="col-sm-12 ">
              <ul>
                <li><strong>3PM Code: </strong> {cmCode}</li>
                <li> | </li>
                <li><strong>3PM Description: </strong> {cmDescription}</li>
                <li> | </li>
                <li>
                  <strong>Status: </strong>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: 8,
                    padding: '2px 14px',
                    borderRadius: 12,
                    background: status === 'approved' || status === 'Active' ? '#30ea03' : status === 'pending' ? 'purple' : status === 'rejected' || status === 'Deactive' ? '#ccc' : '#ccc',
                    color: status === 'approved' || status === 'Active' ? '#000' : '#fff',
                    fontWeight: 600
                  }}>
                    {status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'N/A'}
                  </span>
                </li>
                <li> | </li>
                <li>
                  <strong>Total SKUs: </strong> {skuData.length}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <div className="filters">
              <ul>
                <li>
                  <div className="fBold">Years</div>
                  <MultiSelect
                    options={years.map(y => ({ value: y, label: y }))}
                    selectedValues={selectedYears}
                    onSelectionChange={setSelectedYears}
                    placeholder="Select Years..."
                    disabled={years.length === 0}
                    loading={years.length === 0}
                  />
                </li>
                <li>
                  <div className="fBold">SKU Code-Description</div>
                  <MultiSelect
                    options={skuDescriptions.map(desc => ({ value: desc, label: desc }))}
                    selectedValues={selectedSkuDescriptions}
                    onSelectionChange={setSelectedSkuDescriptions}
                    placeholder="Select SKU Code-Description..."
                    disabled={skuDescriptions.length === 0}
                    loading={skuDescriptions.length === 0}
                  />
                </li>
                <li>
                  <button className="btnCommon btnGreen filterButtons" onClick={handleSearch} disabled={loading}>
                    <span>Search</span>
                    <i className="ri-search-line"></i>
                  </button>
                </li>
                <li>
                  <button className="btnCommon btnBlack filterButtons" onClick={handleReset} disabled={loading}>
                    <span>Reset</span>
                    <i className="ri-refresh-line"></i>
                  </button>
                </li>
                <li style={{ marginLeft: 'auto' }}>
                  <button
                    className="add-sku-btn"
                    style={{ backgroundColor: '#30ea03', color: '#000', marginBottom: 0, float: 'right', minWidth: 120 }}
                    onClick={() => setShowSkuModal(true)}
                  >
                    Add SKU <i className="ri-add-circle-line"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <i className="ri-loader-4-line spinning" style={{ fontSize: '24px', color: '#666' }}></i>
            <p>Loading SKU details...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>Error loading SKU details: {error}</p>
          </div>
        ) : (
          <div className="panel-group" id="accordion">
            {filteredSkuData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No SKU data available for this CM Code</p>
              </div>
            ) : (
              filteredSkuData.map((sku, index) => (
                <div key={sku.id} className="panel panel-default" style={{ marginBottom: 10, borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                  <div
                    className="panel-heading panel-title"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: '#000', color: '#fff', fontWeight: 600 }}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span style={{ marginRight: 12, fontSize: 28 }}>
                      {openIndex === index
                        ? <i className="ri-indeterminate-circle-line"></i>
                        : <i className="ri-add-circle-line"></i>
                      }
                    </span>
                    <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <strong>{sku.sku_code}</strong> || {sku.sku_description}
                    </span>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                      <button
                        style={{
                          background: sku.is_active ? '#30ea03' : '#ccc',
                          color: sku.is_active ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          padding: '6px 18px',
                          cursor: 'pointer',
                          marginLeft: 8,
                          minWidth: 90
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          handleHeaderStatusClick(sku.id, sku.is_active);
                        }}
                      >
                        {sku.is_active ? 'Active' : 'Deactive'}
                      </button>
                    </span>
                  </div>
                  <Collapse isOpened={openIndex === index}>
                    <div className="panel-body" style={{ minHeight: 80, padding: 24, position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <button
                          style={{
                            background: '#30ea03',
                            color: '#000',
                            border: 'none',
                            borderRadius: 4,
                            fontWeight: 'bold',
                            padding: '8px 22px',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                          title="Edit SKU"
                          onClick={() => {
                            console.log('SKU passed to Edit:', sku);
                            handleEditSkuOpen(sku);
                          }}
                        >
                          <i className="ri-pencil-line" style={{ fontSize: 18, marginRight: 6 }} />
                          Edit SKU
                        </button>
                      </div>
                      <p><strong>Reference SKU: </strong> {sku.sku_reference}</p>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, marginRight: 8 }}>Component Detail:</span>
                        <span style={{ marginRight: 8 }}>Packaging Type</span>
                        <input type="radio" name={`option-${sku.id}`} value="Option 1" style={{ marginRight: 8 }} />
                        <span style={{ marginRight: 8 }}>Material Type</span>
                        <input type="radio" name={`option-${sku.id}`} value="Option 2" style={{ marginRight: 8 }} />
                        <button
                          className="add-sku-btn"
                          style={{ backgroundColor: '#30ea03', color: '#000', marginLeft: 'auto', minWidth: 140 }}
                          onClick={e => { e.stopPropagation(); setShowAddComponentModal(true); }}
                        >
                          Add Component <i className="ri-add-circle-line"></i>
                        </button>
                      </div>
                      <div className="table-responsive tableCommon tableGreen" style={{ overflowX: 'auto' }}>
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#39ea03', minWidth: 80 }}>Actions</th>
                              <th style={{ position: 'sticky', left: 80, zIndex: 2, background: '#39ea03', minWidth: 80 }}>Is Active</th>
                              <th>Material Type</th>
                              <th>Component Reference</th>
                              <th>Component Code</th>
                              <th>Component Description</th>
                              <th>Valid From</th>
                              <th>To</th>
                              <th>Material Group</th>
                              <th>QTV</th>
                              <th>UoM</th>
                              <th>Basic UoM</th>
                              <th>Packaging Type</th>
                              <th>Weight Type</th>
                              <th>Unit Measure</th>
                              <th>% Post Customer</th>
                              <th>% Post Industrial</th>
                              <th>Text 1</th>
                              <th>Text 2</th>
                              <th>Text 3</th>
                              <th>Text 4</th>
                              <th>Text 5</th>
                              <th>Text 6</th>
                              <th>Text 7</th>
                              <th>Text 8</th>
                              <th>Text 9</th>
                              <th>Text 10</th>
                              <th>Text 11</th>
                              <th>Text 12</th>
                            </tr>
                          </thead>
                          <tbody>
                            {componentRows.map((row, idx) => (
                              <tr key={row.id}>
                                <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                                  <i className="ri-edit-line" onClick={() => setShowComponentModal(true)}></i>
                                  <i className="bi bi-pencil-square"></i>
                                  <i className="ri-eye-line"></i>
                                </td>
                                <td style={{ position: 'sticky', left: 80, background: '#fff', zIndex: 1 }}>
                                  <input
                                    type="checkbox"
                                    name={`is_active_table_row_${row.id}`}
                                    checked={row.is_active}
                                    onChange={() => handleComponentIsActiveChange(row.id, row.is_active)}
                                  />
                                </td>
                                <td>{row.material_type}</td>
                                <td>{row.component_reference}</td>
                                <td>{row.component_code}</td>
                                <td>{row.component_description}</td>
                                <td>{row.valid_from}</td>
                                <td>{row.valid_to}</td>
                                <td>{row.material_group}</td>
                                <td>{row.qtv}</td>
                                <td>{row.uom}</td>
                                <td>{row.basic_uom}</td>
                                <td>{row.packaging_type}</td>
                                <td>{row.weight_type}</td>
                                <td>{row.unit_measure}</td>
                                <td>{row.post_customer}</td>
                                <td>{row.post_industrial}</td>
                                <td>{row.text1}</td>
                                <td>{row.text2}</td>
                                <td>{row.text3}</td>
                                <td>{row.text4}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Collapse>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* SKU Modal */}
      {showSkuModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: 'rgb(48, 234, 3)', color: '#000', borderBottom: '2px solid #000', alignItems: 'center' }}>
                <h5 className="modal-title" style={{ color: '#000', fontWeight: 700, flex: 1 }}>Add SKU Details</h5>
                {/* Only one close button, styled black, large, right-aligned */}
                <button
                  type="button"
                  onClick={() => setShowSkuModal(false)}
                  aria-label="Close"
                  style={{ background: 'none', border: 'none', color: '#000', fontSize: 32, fontWeight: 900, lineHeight: 1, cursor: 'pointer', marginLeft: 8 }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ background: '#fff' }}>
                <div className="container-fluid">
                  <div className="row g-3">
                    {/* Period dropdown */}
                    <div className="col-md-6">
                      <label>Period</label>
                      <select
                        className={`form-control${addSkuErrors.period ? ' is-invalid' : ''}`}
                        value={addSkuPeriod}
                        onChange={e => setAddSkuPeriod(e.target.value)}
                        disabled={addSkuLoading}
                      >
                        <option value="">Select Period</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      {addSkuErrors.period && <div className="invalid-feedback" style={{ color: 'red' }}>{addSkuErrors.period}</div>}
                    </div>
                    {/* SKU text field */}
                    <div className="col-md-6">
                      <label>SKU</label>
                      <input
                        type="text"
                        className={`form-control${addSkuErrors.sku ? ' is-invalid' : ''}`}
                        value={addSku}
                        onChange={e => setAddSku(e.target.value)}
                        disabled={addSkuLoading}
                      />
                      {addSkuErrors.sku && <div className="invalid-feedback" style={{ color: 'red' }}>{addSkuErrors.sku}</div>}
                    </div>
                    {/* SKU Description text field */}
                    <div className="col-md-6">
                      <label>SKU Description</label>
                      <input
                        type="text"
                        className={`form-control${addSkuErrors.skuDescription ? ' is-invalid' : ''}`}
                        value={addSkuDescription}
                        onChange={e => setAddSkuDescription(e.target.value)}
                        disabled={addSkuLoading}
                      />
                      {addSkuErrors.skuDescription && <div className="invalid-feedback" style={{ color: 'red' }}>{addSkuErrors.skuDescription}</div>}
                    </div>
                    {/* Purchased Quantity text field */}
                    <div className="col-md-6">
                      <label>Purchased Quantity</label>
                      <input
                        type="text"
                        className={`form-control${addSkuErrors.qty ? ' is-invalid' : ''}`}
                        value={addSkuQty}
                        onChange={e => setAddSkuQty(e.target.value)}
                        disabled={addSkuLoading}
                      />
                      {addSkuErrors.qty && <div className="invalid-feedback" style={{ color: 'red' }}>{addSkuErrors.qty}</div>}
                    </div>
                  </div>
                  {addSkuErrors.server && <div style={{ color: 'red', marginTop: 16, fontWeight: 600 }}>{addSkuErrors.server}</div>}
                  {addSkuSuccess && <div style={{ color: '#30ea03', marginTop: 16, fontWeight: 600 }}>{addSkuSuccess}</div>}
                </div>
              </div>
              {/* Professional footer, white bg, black top border, Save button right-aligned */}
              <div className="modal-footer" style={{ background: '#fff', borderTop: '2px solid #000', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'rgb(48, 234, 3)', border: 'none', color: '#000', minWidth: 100, fontWeight: 600 }}
                  onClick={handleAddSkuSave}
                  disabled={addSkuLoading}
                  onMouseOver={e => e.currentTarget.style.color = '#fff'}
                  onMouseOut={e => e.currentTarget.style.color = '#000'}
                >
                  {addSkuLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditSkuModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: 'rgb(48, 234, 3)', color: '#000', borderBottom: '2px solid #000', alignItems: 'center' }}>
                <h5 className="modal-title" style={{ color: '#000', fontWeight: 700, flex: 1 }}>Edit SKU Details</h5>
                <button
                  type="button"
                  onClick={() => setShowEditSkuModal(false)}
                  aria-label="Close"
                  style={{ background: 'none', border: 'none', color: '#000', fontSize: 32, fontWeight: 900, lineHeight: 1, cursor: 'pointer', marginLeft: 8 }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ background: '#fff' }}>
                <div className="container-fluid">
                  <div className="row g-3">
                    {/* Period (read-only) */}
                    <div className="col-md-6">
                      <label>
                        Period <span style={{ color: 'red' }}>*</span>
                        <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>
                          <i className="ri-lock-line" style={{ fontSize: 14, verticalAlign: 'middle' }} /> Read Only
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.period}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                    {/* SKU (read-only) */}
                    <div className="col-md-6">
                      <label>
                        SKU <span style={{ color: 'red' }}>*</span>
                        <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>
                          <i className="ri-lock-line" style={{ fontSize: 14, verticalAlign: 'middle' }} /> Read Only
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.sku}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                    {/* SKU Description (read-only) */}
                    <div className="col-md-6">
                      <label>
                        SKU Description <span style={{ color: 'red' }}>*</span>
                        <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>
                          <i className="ri-lock-line" style={{ fontSize: 14, verticalAlign: 'middle' }} /> Read Only
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.skuDescription}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                    {/* Purchased Quantity text field (required) */}
                    <div className="col-md-6">
                      <label>Purchased Quantity <span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="text"
                        className={`form-control${editSkuErrors.qty ? ' is-invalid' : ''}`}
                        value={editSkuData.qty}
                        onChange={e => setEditSkuData({ ...editSkuData, qty: e.target.value })}
                        placeholder="Enter Purchased Quantity"
                        disabled={editSkuLoading}
                      />
                      {editSkuErrors.qty && <div className="invalid-feedback" style={{ color: 'red' }}>{editSkuErrors.qty}</div>}
                    </div>
                    {/* Dual-source SKU text field (optional) */}
                    <div className="col-md-6">
                      <label>Dual-source SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.dualSource}
                        onChange={e => setEditSkuData({ ...editSkuData, dualSource: e.target.value })}
                        placeholder="Enter Dual-source SKU"
                        disabled={editSkuLoading}
                      />
                    </div>
                    {/* SKU Reference searchable box (optional) */}
                    <div className="col-md-6">
                      <label>SKU Reference</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.skuReference}
                        onChange={e => setEditSkuData({ ...editSkuData, skuReference: e.target.value })}
                        placeholder="Enter SKU Reference"
                        disabled={editSkuLoading}
                      />
                    </div>
                    {/* Formulation Reference text field (optional) */}
                    <div className="col-md-6">
                      <label>Formulation Reference</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSkuData.formulationReference}
                        onChange={e => setEditSkuData({ ...editSkuData, formulationReference: e.target.value })}
                        placeholder="Enter Formulation Reference"
                        disabled={editSkuLoading}
                      />
                    </div>
                  </div>
                  {editSkuErrors.server && <div style={{ color: 'red', marginTop: 16, fontWeight: 600 }}>{editSkuErrors.server}</div>}
                  {editSkuSuccess && <div style={{ color: '#30ea03', marginTop: 16, fontWeight: 600 }}>{editSkuSuccess}</div>}
                </div>
              </div>
              <div className="modal-footer" style={{ background: '#fff', borderTop: '2px solid #000', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'rgb(48, 234, 3)', border: 'none', color: '#000', minWidth: 100, fontWeight: 600 }}
                  onClick={handleEditSkuUpdate}
                  disabled={editSkuLoading}
                >
                  {editSkuLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddComponentModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#30ea03', color: '#000', borderBottom: '2px solid #000', alignItems: 'center' }}>
                <h5 className="modal-title" style={{ color: '#000', fontWeight: 700, flex: 1 }}>Add Component</h5>
                <button
                  type="button"
                  onClick={() => setShowAddComponentModal(false)}
                  aria-label="Close"
                  style={{ background: 'none', border: 'none', color: '#000', fontSize: 32, fontWeight: 900, lineHeight: 1, cursor: 'pointer', marginLeft: 8 }}
                >
                  &times;
                </button>
              </div>
                      <div className="modal-body" style={{ background: '#fff' }}>
          <div className="container-fluid">
            <div className="row g-3">
              {/* Component Type (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Type</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Type</option>
                  <option value="Type1">Type 1</option>
                  <option value="Type2">Type 2</option>
                </select>
              </div>
              {/* Component Code (Free text) */}
              <div className="col-md-6">
                <label>Component Code</label>
                <input type="text" className="form-control" value={addComponentData.componentCode} onChange={e => setAddComponentData({ ...addComponentData, componentCode: e.target.value })} />
                {addComponentErrors.componentCode && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentCode}</div>}
              </div>
              {/* Component Description (Free text) */}
              <div className="col-md-6">
                <label>Component Description</label>
                <input type="text" className="form-control" value={addComponentData.componentDescription} onChange={e => setAddComponentData({ ...addComponentData, componentDescription: e.target.value })} />
                {addComponentErrors.componentDescription && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentDescription}</div>}
              </div>
              {/* Component validity date - From (Date) */}
              <div className="col-md-6">
                <label>Component validity date - From</label>
                <input type="date" className="form-control" value={addComponentData.validityFrom} onChange={e => setAddComponentData({ ...addComponentData, validityFrom: e.target.value })} />
                {addComponentErrors.validityFrom && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.validityFrom}</div>}
              </div>
              {/* Component validity date - To (Date) */}
              <div className="col-md-6">
                <label>Component validity date - To</label>
                <input type="date" className="form-control" value={addComponentData.validityTo} onChange={e => setAddComponentData({ ...addComponentData, validityTo: e.target.value })} />
                {addComponentErrors.validityTo && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.validityTo}</div>}
              </div>
              {/* Component Category (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Category</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Category</option>
                  <option value="Cat1">Category 1</option>
                  <option value="Cat2">Category 2</option>
                </select>
              </div>
              {/* Component Quantity (Numeric) */}
              <div className="col-md-6">
                <label>Component Quantity</label>
                <input type="number" className="form-control" value={addComponentData.componentQuantity} onChange={e => setAddComponentData({ ...addComponentData, componentQuantity: e.target.value })} />
                {addComponentErrors.componentQuantity && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentQuantity}</div>}
              </div>
              {/* Component Unit of Measure (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Unit of Measure</label>
                <select className="form-control select-with-icon">
                  <option value="">Select UoM</option>
                  <option value="UOM1">UOM 1</option>
                  <option value="UOM2">UOM 2</option>
                </select>
              </div>
              {/* Component Base Quantity (Numeric) */}
              <div className="col-md-6">
                <label>Component Base Quantity</label>
                <input type="number" className="form-control" value={addComponentData.componentBaseQuantity} onChange={e => setAddComponentData({ ...addComponentData, componentBaseQuantity: e.target.value })} />
                {addComponentErrors.componentBaseQuantity && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentBaseQuantity}</div>}
              </div>
              {/* Component Base Unit of Measure (Default to Each) */}
              <div className="col-md-6">
                <label>Component Base Unit of Measure</label>
                <input type="text" className="form-control" value={addComponentData.componentBaseUnitOfMeasure} onChange={e => setAddComponentData({ ...addComponentData, componentBaseUnitOfMeasure: e.target.value })} placeholder="Each" />
                {addComponentErrors.componentBaseUnitOfMeasure && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentBaseUnitOfMeasure}</div>}
              </div>
              {/* %w/w (Percentage) */}
              <div className="col-md-6">
                <label>%w/w</label>
                <input type="number" className="form-control" value={addComponentData.wW} onChange={e => setAddComponentData({ ...addComponentData, wW: e.target.value })} placeholder="Percentage" />
                {addComponentErrors.wW && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.wW}</div>}
              </div>
              {/* Component Packaging Type (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Packaging Type</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Packaging Type</option>
                  <option value="Type1">Type 1</option>
                  <option value="Type2">Type 2</option>
                </select>
              </div>
              {/* Component Packaging Material (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Packaging Material</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Packaging Material</option>
                  <option value="Material1">Material 1</option>
                  <option value="Material2">Material 2</option>
                </select>
              </div>
              {/* Component Unit Weight (Numeric) */}
              <div className="col-md-6">
                <label>Component Unit Weight</label>
                <input type="number" className="form-control" value={addComponentData.componentUnitWeight} onChange={e => setAddComponentData({ ...addComponentData, componentUnitWeight: e.target.value })} />
                {addComponentErrors.componentUnitWeight && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentUnitWeight}</div>}
              </div>
              {/* Component Weight Unit of Measure (Drop-down list) */}
              <div className="col-md-6">
                <label>Component Weight Unit of Measure</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Weight UoM</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
              {/* % Mechanical Post-Consumer Recycled Content (inc. Chemical) (Percentage) */}
              <div className="col-md-6">
                <label>% Mechanical Post-Consumer Recycled Content (inc. Chemical)</label>
                <input type="number" className="form-control" value={addComponentData.percentPostConsumer} onChange={e => setAddComponentData({ ...addComponentData, percentPostConsumer: e.target.value })} placeholder="Percentage" />
                {addComponentErrors.percentPostConsumer && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.percentPostConsumer}</div>}
              </div>
              {/* % Mechanical Post-Industrial Recycled Content (Percentage) */}
              <div className="col-md-6">
                <label>% Mechanical Post-Industrial Recycled Content</label>
                <input type="number" className="form-control" value={addComponentData.percentPostIndustrial} onChange={e => setAddComponentData({ ...addComponentData, percentPostIndustrial: e.target.value })} placeholder="Percentage" />
                {addComponentErrors.percentPostIndustrial && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.percentPostIndustrial}</div>}
              </div>
              {/* % Chemical Recycled Content (Percentage) */}
              <div className="col-md-6">
                <label>% Chemical Recycled Content</label>
                <input type="number" className="form-control" value={addComponentData.percentChemical} onChange={e => setAddComponentData({ ...addComponentData, percentChemical: e.target.value })} placeholder="Percentage" />
                {addComponentErrors.percentChemical && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.percentChemical}</div>}
              </div>
              {/* % Bio-sourced? (Percentage) */}
              <div className="col-md-6">
                <label>% Bio-sourced?</label>
                <input type="number" className="form-control" value={addComponentData.percentBioSourced} onChange={e => setAddComponentData({ ...addComponentData, percentBioSourced: e.target.value })} placeholder="Percentage" />
                {addComponentErrors.percentBioSourced && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.percentBioSourced}</div>}
              </div>
              {/* Material structure - multimaterials only (with % wt) (Free text) */}
              <div className="col-md-6">
                <label>Material structure - multimaterials only (with % wt)</label>
                <input type="text" className="form-control" value={addComponentData.materialStructure} onChange={e => setAddComponentData({ ...addComponentData, materialStructure: e.target.value })} />
                {addComponentErrors.materialStructure && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.materialStructure}</div>}
              </div>
              {/* Component packaging colour / opacity (Free text) */}
              <div className="col-md-6">
                <label>Component packaging colour / opacity</label>
                <input type="text" className="form-control" value={addComponentData.packagingColour} onChange={e => setAddComponentData({ ...addComponentData, packagingColour: e.target.value })} />
                {addComponentErrors.packagingColour && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.packagingColour}</div>}
              </div>
              {/* Component packaging level (Drop-down list) */}
              <div className="col-md-6">
                <label>Component packaging level</label>
                <select className="form-control select-with-icon">
                  <option value="">Select Packaging Level</option>
                  <option value="Level1">Level 1</option>
                  <option value="Level2">Level 2</option>
                </select>
              </div>
              {/* Component dimensions (3D - LxWxH, 2D - LxW) (Free text) */}
              <div className="col-md-6">
                <label>Component dimensions (3D - LxWxH, 2D - LxW)</label>
                <input type="text" className="form-control" value={addComponentData.componentDimensions} onChange={e => setAddComponentData({ ...addComponentData, componentDimensions: e.target.value })} />
                {addComponentErrors.componentDimensions && <div style={{ color: 'red', fontSize: 13 }}>{addComponentErrors.componentDimensions}</div>}
              </div>
            </div>
          </div>
        </div>
              <div className="col-12" style={{ marginTop: 24 }}>
  <h5 style={{ fontWeight: 700, color: '#000', marginBottom: 12, display: 'inline-block' }}>Upload Evidence</h5>
  <input
    type="checkbox"
    id="select-for-all-checkbox"
    checked={selectForAll}
    onChange={e => {
      setSelectForAll(e.target.checked);
      if (e.target.checked) {
        // If any field has files, sync all to the first non-empty
        const firstWithFiles = evidenceFiles.find(files => files.length > 0) || [];
        setEvidenceFiles([firstWithFiles, firstWithFiles, firstWithFiles, firstWithFiles]);
      }
    }}
    style={{ marginLeft: 16, verticalAlign: 'middle' }}
  />
  <label htmlFor="select-for-all-checkbox" style={{ marginLeft: 8, fontWeight: 500, color: '#000' }}>Select for All</label>
  <div className="row g-3" style={{ marginTop: 8 }}>
    {[1,2,3,4].map(idx => (
      <div className="col-md-6" key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ marginBottom: 0, minWidth: 160 }}>{`Evidence Category ${idx}`}</label>
        <input
          type="file"
          className="form-control"
          multiple
          style={{ flex: 1 }}
          value={undefined} // allow re-upload
          onChange={e => {
            const files = Array.from(e.target.files || []);
            if (selectForAll) {
              if (files.length === 0) {
                setEvidenceFiles([[], [], [], []]);
              } else {
                setEvidenceFiles([files, files, files, files]);
              }
            } else {
              const newFiles = [...evidenceFiles];
              newFiles[idx-1] = files;
              setEvidenceFiles(newFiles);
            }
          }}
        />
        {/* Show selected files */}
        <div style={{ marginLeft: 8, flex: 1 }}>
          {evidenceFiles[idx-1] && evidenceFiles[idx-1].length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12 }}>
              {evidenceFiles[idx-1].map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
              <div className="modal-footer" style={{ background: '#fff', borderTop: '2px solid #000', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'rgb(48, 234, 3)', border: 'none', color: '#000', minWidth: 100, fontWeight: 600 }}
                  onClick={handleAddComponentSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showConfirm}
        message={pendingSkuStatus ? 'Are you sure you want to deactivate this SKU?' : 'Are you sure you want to activate this SKU?'}
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
      />
    </Layout>
  );
};

export default CmSkuDetail; 
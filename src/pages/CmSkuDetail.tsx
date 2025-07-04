import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';

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

const CmSkuDetail: React.FC = () => {
  const { cmCode } = useParams();
  const location = useLocation();
  const cmDescription = location.state?.cmDescription || '';
  const status = location.state?.status || '';

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

  // Fetch SKU details from API
  useEffect(() => {
    const fetchSkuDetails = async () => {
      if (!cmCode) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:5000/sku-details/${cmCode}`);
        
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

    fetchSkuDetails();
  }, [cmCode]);

  // Handler to update is_active status
  const handleIsActiveChange = async (skuId: number, currentStatus: boolean) => {
    try {
      // Optimistically update UI
      setSkuData(prev => prev.map(sku => sku.id === skuId ? { ...sku, is_active: !currentStatus } : sku));
      // Send PATCH request
      await fetch(`http://localhost:5000/sku-details/${skuId}/is-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <Layout>
      {loading && <Loader />}
      <div className="mainInternalPages" style={{ opacity: loading ? 0.5 : 1 }}>
        <div className="commonTitle">
          <div className="icon">
            <i className="ri-file-list-3-fill"></i>
          </div>
          <h1>CM Detail</h1>
        </div>

        <div className="filters CMDetails">
          <div className="row">
            <div className="col-sm-12 ">
              <ul>
                <li><strong>CM Code: </strong> {cmCode}</li>
                <li> | </li>
                <li><strong> CM Description: </strong> {cmDescription}</li>
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
                  <span style={{ marginLeft: 24 }}>
                    <strong>Total SKUs: </strong> {skuData.length}
                  </span>
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
                  <select className="form-control">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                </li>
                <li>
                  <div className="fBold">SKU Code-Description</div>
                  <select className="form-control">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                </li>
                <li>
                  <button className="btnCommon btnGreen filterButtons" style={{ backgroundColor: '#30ea03', color: '#000' }}>
                    <span>Search</span>
                    <i className="ri-search-line"></i>
                  </button>
                </li>
                <li>
                  <button className="btnCommon btnBlack filterButtons">
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
            {skuData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No SKU data available for this CM Code</p>
              </div>
            ) : (
              skuData.map((sku, index) => (
                <div key={sku.id} className="panel panel-default" style={{ marginBottom: 10, borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                  <div
                    className="panel-heading panel-title"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: '#000', color: '#fff', fontWeight: 600 }}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '3px solid #fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#000',
                      boxSizing: 'border-box',
                      marginRight: 12,
                    }}>
                      <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {openIndex === index ? '\u2212' : '\u002b'}
                      </span>
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
                  <div
                    className={`panel-collapse collapse${openIndex === index ? ' in' : ''}`}
                    style={{ display: openIndex === index ? 'block' : 'none' }}
                  >
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
                          onClick={e => { e.stopPropagation(); /* Add edit logic here */ }}
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
                          onClick={e => { e.stopPropagation(); setShowComponentModal(true); }}
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
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Component Modal */}
      {showComponentModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#30ea03' }}>
                <h5 className="modal-title">Add Component Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowComponentModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row g-3">
                    {/* Begin Fields */}
                    <div className="col-md-6"><label>Material Type</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Reference</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Code</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Description</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Valid Date From</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Valid Date To</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Material Group (Category)</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component QTY</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component UoM</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Base UoM</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Packaging Type</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Unit Weight Type</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Unit of Measure</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>% Mechanical Post-Consumer Recycled Content</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>% Mechanical Post-Industrial Recycled Content</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>% Chemical Recycled Content</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>% Bio-sourced?</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Material Structure (Multimaterials with % wt)</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Packaging Colour/Opacity</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Packaging Level</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Component Dimension (3D-LxWxH, 2D LxW)</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Packaging Specification Evidence</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Evidence of Chemical Recycled or Bio-source</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>Last Updated Date</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6">
                      <label>Proof of Evidence File <span className="text-danger">*</span></label>
                      <input type="file" className="form-control" />
                      <small className="text-muted" style={{ color: 'red' }}>Max file size: 50MB</small>
                    </div>
                    {/* End Fields */}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" style={{ backgroundColor: '#30ea03', border: 'none', color: '#000' }} onClick={() => setShowComponentModal(false)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SKU Modal */}
      {showSkuModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#30ea03' }}>
                <h5 className="modal-title">Add SKU Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowSkuModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row g-3">
                    {/* Begin Fields */}
                    <div className="col-md-6"><label>SKU</label><input type="text" className="form-control" /></div>
                    <div className="col-md-6"><label>SKU Description</label><input type="text" className="form-control" /></div>
                    {/* End Fields */}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" style={{ backgroundColor: '#30ea03', border: 'none', color: '#000' }} onClick={() => setShowSkuModal(false)}>
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
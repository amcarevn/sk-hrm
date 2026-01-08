import React, { useState, useEffect } from 'react';
import { departmentsAPI, employeesAPI, Department, Employee } from '../utils/api';
import { BuildingOfficeIcon, UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TreeNode {
  id: number;
  name: string;
  type: 'department' | 'employee';
  children: TreeNode[];
  data: Department | Employee;
  expanded?: boolean;
}

const OrganizationChart: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments and employees
      const [departmentsResponse, employeesResponse] = await Promise.all([
        departmentsAPI.list(),
        employeesAPI.list({ page_size: 1000 }) // Get all employees
      ]);

      const departments = departmentsResponse.results;
      const employees = employeesResponse.results;

      // Build tree structure
      const departmentMap = new Map<number, TreeNode>();
      const rootNodes: TreeNode[] = [];

      // Create department nodes
      departments.forEach(dept => {
        const node: TreeNode = {
          id: dept.id,
          name: dept.name,
          type: 'department',
          children: [],
          data: dept,
          expanded: true
        };
        departmentMap.set(dept.id, node);
      });

      // Build hierarchy
      departments.forEach(dept => {
        const node = departmentMap.get(dept.id)!;
        if (dept.parent_department && departmentMap.has(dept.parent_department)) {
          const parentNode = departmentMap.get(dept.parent_department)!;
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      });

      // Add employees to their departments
      employees.forEach(emp => {
        const employeeNode: TreeNode = {
          id: emp.id,
          name: emp.full_name,
          type: 'employee',
          children: [],
          data: emp
        };

        if (emp.department?.id && departmentMap.has(emp.department.id)) {
          const deptNode = departmentMap.get(emp.department.id)!;
          deptNode.children.push(employeeNode);
        } else {
          // If employee has no department, add to root
          rootNodes.push(employeeNode);
        }
      });

      setTreeData(rootNodes);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching organization data:', err);
      setError('Không thể tải dữ liệu tổ chức. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: number, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId && node.type === 'department') {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children.length > 0) {
        return { ...node, children: toggleNode(nodeId, node.children) };
      }
      return node;
    });
  };

  const handleToggle = (nodeId: number) => {
    setTreeData(prev => toggleNode(nodeId, prev));
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isDepartment = node.type === 'department';
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded;

    return (
      <div key={`${node.type}-${node.id}`} className="mb-2">
        <div 
          className={`flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${isDepartment ? 'bg-blue-50' : 'bg-white'}`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => isDepartment && handleToggle(node.id)}
        >
          <div className="flex items-center flex-1">
            {isDepartment && (
              <div className="mr-2">
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  )
                ) : (
                  <div className="w-4" />
                )}
              </div>
            )}
            <div className={`p-2 rounded-md ${isDepartment ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {isDepartment ? (
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <UserIcon className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900">{node.name}</div>
              <div className="text-sm text-gray-500">
                {isDepartment ? (
                  `Phòng ban • ${node.children.filter(c => c.type === 'employee').length} nhân viên`
                ) : (
                  `Nhân viên • ${(node.data as Employee).position?.title || 'Chưa phân chức vụ'}`
                )}
              </div>
            </div>
          </div>
          {isDepartment && (
            <div className="text-sm text-gray-500">
              {node.children.filter(c => c.type === 'employee').length} nhân viên
            </div>
          )}
        </div>
        
        {isDepartment && isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFlatView = () => {
    const allEmployees: TreeNode[] = [];
    
    const collectEmployees = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'employee') {
          allEmployees.push(node);
        }
        if (node.children.length > 0) {
          collectEmployees(node.children);
        }
      });
    };
    
    collectEmployees(treeData);

    return (
      <div className="space-y-3">
        {allEmployees.map(employee => {
          const empData = employee.data as Employee;
          return (
            <div key={`employee-${employee.id}`} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-gray-100">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-sm text-gray-500">
                    {empData.employee_id} • {empData.position?.title || 'Chưa phân chức vụ'}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {empData.department?.name || 'Chưa phân phòng'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sơ đồ tổ chức...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
            <button
              onClick={fetchOrganizationData}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sơ đồ tổ chức</h1>
            <p className="mt-1 text-sm text-gray-600">
              Xem cấu trúc tổ chức công ty theo dạng cây phân cấp
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'hierarchical'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dạng cây
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'flat'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Danh sách phẳng
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <div className="flex items-center mr-4">
              <BuildingOfficeIcon className="h-4 w-4 text-blue-600 mr-1" />
              <span>Phòng ban</span>
            </div>
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-600 mr-1" />
              <span>Nhân viên</span>
            </div>
          </div>

          {treeData.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu tổ chức</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng cách thêm phòng ban và nhân viên.
              </p>
            </div>
          ) : viewMode === 'hierarchical' ? (
            <div className="space-y-2">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          ) : (
            renderFlatView()
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thống kê</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Tổng số phòng ban</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {treeData.filter(node => node.type === 'department').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Tổng số nhân viên</p>
                  <p className="text-2xl font-bold text-green-700">
                    {(() => {
                      let count = 0;
                      const countEmployees = (nodes: TreeNode[]) => {
                        nodes.forEach(node => {
                          if (node.type === 'employee') count++;
                          if (node.children.length > 0) countEmployees(node.children);
                        });
                      };
                      countEmployees(treeData);
                      return count;
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Cấp độ sâu nhất</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(() => {
                      let maxDepth = 0;
                      const calculateDepth = (nodes: TreeNode[], depth: number) => {
                        nodes.forEach(node => {
                          maxDepth = Math.max(maxDepth, depth);
                          if (node.children.length > 0) {
                            calculateDepth(node.children, depth + 1);
                          }
                        });
                      };
                      calculateDepth(treeData, 1);
                      return maxDepth;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationChart;

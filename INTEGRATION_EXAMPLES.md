# Integration Examples - Condo Pro Dashboard API

## ตัวอย่างการใช้งาน API

### 1. JavaScript/Node.js Integration

#### การตั้งค่าเบื้องต้น
```javascript
const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'sk_your_api_key_here';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};
```

#### ดึงข้อมูลห้องชุดทั้งหมด
```javascript
async function getAllUnits(page = 1, limit = 50) {
  try {
    const response = await fetch(`${API_BASE}/units?page=${page}&limit=${limit}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching units:', error);
    throw error;
  }
}

// ใช้งาน
getAllUnits(1, 10).then(data => {
  console.log('Units:', data.data);
  console.log('Total:', data.pagination.total);
});
```

#### สร้างห้องชุดใหม่
```javascript
async function createUnit(unitData) {
  try {
    const response = await fetch(`${API_BASE}/units`, {
      method: 'POST',
      headers,
      body: JSON.stringify(unitData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error;
  }
}

// ใช้งาน
const newUnit = {
  unit_number: "103",
  floor: 1,
  size: 45.5,
  owner_name: "John Smith",
  owner_phone: "0812345678",
  owner_email: "john@example.com",
  residents: 2,
  status: "occupied"
};

createUnit(newUnit).then(data => {
  console.log('Created unit:', data.data);
});
```

#### ดึงข้อมูลบิลตามห้องชุด
```javascript
async function getBillsByUnit(unitId, month, year) {
  try {
    const params = new URLSearchParams({
      unit_id: unitId,
      month: month,
      year: year.toString()
    });
    
    const response = await fetch(`${API_BASE}/bills?${params}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
}

// ใช้งาน
getBillsByUnit('unit-uuid', 'January', 2024).then(data => {
  console.log('Bills:', data.data);
});
```

### 2. Python Integration

#### การตั้งค่าเบื้องต้น
```python
import requests
import json
from typing import Dict, List, Optional

API_BASE = 'https://your-domain.com/api/v1'
API_KEY = 'sk_your_api_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}
```

#### Class สำหรับจัดการ API
```python
class CondoProAPI:
    def __init__(self, api_base: str, api_key: str):
        self.api_base = api_base
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        url = f"{self.api_base}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, params=params)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            raise
    
    def get_units(self, page: int = 1, limit: int = 50, search: str = None, status: str = None) -> Dict:
        params = {'page': page, 'limit': limit}
        if search:
            params['search'] = search
        if status:
            params['status'] = status
        
        return self._make_request('GET', '/units', params=params)
    
    def create_unit(self, unit_data: Dict) -> Dict:
        return self._make_request('POST', '/units', data=unit_data)
    
    def get_unit(self, unit_id: str) -> Dict:
        return self._make_request('GET', f'/units/{unit_id}')
    
    def update_unit(self, unit_id: str, unit_data: Dict) -> Dict:
        return self._make_request('PUT', f'/units/{unit_id}', data=unit_data)
    
    def delete_unit(self, unit_id: str) -> Dict:
        return self._make_request('DELETE', f'/units/{unit_id}')
    
    def get_bills(self, page: int = 1, limit: int = 50, unit_id: str = None, 
                  month: str = None, year: int = None) -> Dict:
        params = {'page': page, 'limit': limit}
        if unit_id:
            params['unit_id'] = unit_id
        if month:
            params['month'] = month
        if year:
            params['year'] = year
        
        return self._make_request('GET', '/bills', params=params)
    
    def create_bill(self, bill_data: Dict) -> Dict:
        return self._make_request('POST', '/bills', data=bill_data)
    
    def get_files(self, page: int = 1, limit: int = 50, category_id: str = None,
                  unit_number: str = None, is_public: bool = None) -> Dict:
        params = {'page': page, 'limit': limit}
        if category_id:
            params['category_id'] = category_id
        if unit_number:
            params['unit_number'] = unit_number
        if is_public is not None:
            params['is_public'] = str(is_public).lower()
        
        return self._make_request('GET', '/files', params=params)

# ใช้งาน
api = CondoProAPI(API_BASE, API_KEY)

# ดึงข้อมูลห้องชุด
units = api.get_units(page=1, limit=10)
print(f"Found {units['pagination']['total']} units")

# สร้างห้องชุดใหม่
new_unit_data = {
    "unit_number": "104",
    "floor": 1,
    "size": 45.5,
    "owner_name": "Jane Smith",
    "owner_phone": "0812345679",
    "owner_email": "jane@example.com",
    "residents": 2,
    "status": "occupied"
}

created_unit = api.create_unit(new_unit_data)
print(f"Created unit: {created_unit['data']['id']}")
```

### 3. PHP Integration

#### การตั้งค่าเบื้องต้น
```php
<?php
class CondoProAPI {
    private $apiBase;
    private $apiKey;
    private $headers;
    
    public function __construct($apiBase, $apiKey) {
        $this->apiBase = $apiBase;
        $this->apiKey = $apiKey;
        $this->headers = [
            'X-API-Key: ' . $apiKey,
            'Content-Type: application/json'
        ];
    }
    
    private function makeRequest($method, $endpoint, $data = null, $params = []) {
        $url = $this->apiBase . $endpoint;
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        
        switch (strtoupper($method)) {
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("API request failed with HTTP code: $httpCode");
        }
        
        return json_decode($response, true);
    }
    
    public function getUnits($page = 1, $limit = 50, $search = null, $status = null) {
        $params = ['page' => $page, 'limit' => $limit];
        if ($search) $params['search'] = $search;
        if ($status) $params['status'] = $status;
        
        return $this->makeRequest('GET', '/units', null, $params);
    }
    
    public function createUnit($unitData) {
        return $this->makeRequest('POST', '/units', $unitData);
    }
    
    public function getBills($page = 1, $limit = 50, $unitId = null, $month = null, $year = null) {
        $params = ['page' => $page, 'limit' => $limit];
        if ($unitId) $params['unit_id'] = $unitId;
        if ($month) $params['month'] = $month;
        if ($year) $params['year'] = $year;
        
        return $this->makeRequest('GET', '/bills', null, $params);
    }
}

// ใช้งาน
$api = new CondoProAPI('https://your-domain.com/api/v1', 'sk_your_api_key_here');

// ดึงข้อมูลห้องชุด
$units = $api->getUnits(1, 10);
echo "Found " . $units['pagination']['total'] . " units\n";

// สร้างห้องชุดใหม่
$newUnit = [
    'unit_number' => '105',
    'floor' => 1,
    'size' => 45.5,
    'owner_name' => 'Bob Johnson',
    'owner_phone' => '0812345680',
    'owner_email' => 'bob@example.com',
    'residents' => 2,
    'status' => 'occupied'
];

$createdUnit = $api->createUnit($newUnit);
echo "Created unit: " . $createdUnit['data']['id'] . "\n";
?>
```

### 4. cURL Examples

#### ดึงข้อมูลห้องชุดทั้งหมด
```bash
curl -X GET "https://your-domain.com/api/v1/units?page=1&limit=10" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json"
```

#### สร้างห้องชุดใหม่
```bash
curl -X POST "https://your-domain.com/api/v1/units" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_number": "106",
    "floor": 1,
    "size": 45.5,
    "owner_name": "Alice Brown",
    "owner_phone": "0812345681",
    "owner_email": "alice@example.com",
    "residents": 2,
    "status": "occupied"
  }'
```

#### ดึงข้อมูลบิลตามห้องชุด
```bash
curl -X GET "https://your-domain.com/api/v1/bills?unit_id=unit-uuid&month=January&year=2024" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json"
```

#### อัปโหลดไฟล์
```bash
curl -X POST "https://your-domain.com/api/v1/files" \
  -H "X-API-Key: sk_your_api_key_here" \
  -F "file=@/path/to/file.pdf" \
  -F "category_id=category-uuid" \
  -F "unit_number=101" \
  -F "description=Contract document" \
  -F "tags=contract,legal" \
  -F "is_public=false"
```

### 5. React Integration

#### Custom Hook สำหรับ API
```javascript
import { useState, useEffect } from 'react';

const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'sk_your_api_key_here';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};

export function useCondoProAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    apiCall,
    getUnits: (params = {}) => apiCall(`/units?${new URLSearchParams(params)}`),
    createUnit: (data) => apiCall('/units', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getBills: (params = {}) => apiCall(`/bills?${new URLSearchParams(params)}`),
    createBill: (data) => apiCall('/bills', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getFiles: (params = {}) => apiCall(`/files?${new URLSearchParams(params)}`)
  };
}

// ใช้งานใน Component
function UnitsList() {
  const { loading, error, getUnits } = useCondoProAPI();
  const [units, setUnits] = useState([]);

  useEffect(() => {
    getUnits({ page: 1, limit: 10 })
      .then(data => setUnits(data.data))
      .catch(err => console.error('Error:', err));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Units</h2>
      {units.map(unit => (
        <div key={unit.id}>
          <h3>{unit.unit_number}</h3>
          <p>Owner: {unit.owner_name}</p>
          <p>Status: {unit.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### 6. Error Handling Examples

#### JavaScript Error Handling
```javascript
async function safeApiCall(apiFunction, ...args) {
  try {
    const result = await apiFunction(...args);
    return { success: true, data: result };
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message.includes('401')) {
      return { success: false, error: 'Unauthorized - Check API Key' };
    } else if (error.message.includes('403')) {
      return { success: false, error: 'Forbidden - Insufficient permissions' };
    } else if (error.message.includes('429')) {
      return { success: false, error: 'Rate limit exceeded - Try again later' };
    } else if (error.message.includes('404')) {
      return { success: false, error: 'Resource not found' };
    } else {
      return { success: false, error: 'Unknown error occurred' };
    }
  }
}

// ใช้งาน
const result = await safeApiCall(getAllUnits, 1, 10);
if (result.success) {
  console.log('Units:', result.data.data);
} else {
  console.error('Error:', result.error);
}
```

### 7. Rate Limiting Handling

#### JavaScript Rate Limiting
```javascript
class RateLimitedAPI {
  constructor(apiBase, apiKey) {
    this.apiBase = apiBase;
    this.apiKey = apiKey;
    this.queue = [];
    this.processing = false;
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const { endpoint, options, resolve, reject } = this.queue.shift();
    
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        ...options
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds`);
        
        setTimeout(() => {
          this.queue.unshift({ endpoint, options, resolve, reject });
          this.processing = false;
          this.processQueue();
        }, retryAfter * 1000);
        return;
      }
      
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.processQueue();
    }
  }
}
```

## การทดสอบ API

### 1. Postman Collection
```json
{
  "info": {
    "name": "Condo Pro Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-domain.com/api/v1"
    },
    {
      "key": "apiKey",
      "value": "sk_your_api_key_here"
    }
  ],
  "item": [
    {
      "name": "Get Units",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "X-API-Key",
            "value": "{{apiKey}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/units?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["units"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    }
  ]
}
```

### 2. Unit Tests (Jest)
```javascript
const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'sk_test_1234567890abcdef1234567890abcdef';

describe('Condo Pro API', () => {
  test('should get units', async () => {
    const response = await fetch(`${API_BASE}/units`, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should create unit', async () => {
    const unitData = {
      unit_number: "999",
      floor: 1,
      size: 45.5,
      owner_name: "Test User"
    };

    const response = await fetch(`${API_BASE}/units`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unitData)
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.unit_number).toBe("999");
  });
});
```

## Best Practices

### 1. API Key Management
- เก็บ API Key ใน environment variables
- ใช้ API Key ที่มีสิทธิ์น้อยที่สุด
- หมุนเวียน API Key เป็นประจำ
- ไม่เก็บ API Key ใน source code

### 2. Error Handling
- ตรวจสอบ HTTP status code
- จัดการ rate limiting
- Log errors สำหรับ debugging
- แสดง error message ที่เข้าใจง่าย

### 3. Performance
- ใช้ pagination สำหรับข้อมูลจำนวนมาก
- Cache ข้อมูลที่เปลี่ยนแปลงไม่บ่อย
- ใช้ parallel requests เมื่อเป็นไปได้
- Monitor API response time

### 4. Security
- ใช้ HTTPS เสมอ
- ตรวจสอบ SSL certificate
- ไม่ส่งข้อมูล sensitive ใน URL parameters
- ใช้ proper authentication headers

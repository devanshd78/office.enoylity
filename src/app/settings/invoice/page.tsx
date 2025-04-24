"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Swal from 'sweetalert2';

type CompanyInfo = {
  name: string;
  address: string;
  city_state: string;
  phone: string;
  youtube: string;
  email: string;
};

type Settings = {
  company_info: CompanyInfo;
  colors: {
    light_pink: [number, number, number];
  };
  logo_path: string;
};

const defaultSettings: Settings = {
  company_info: {
    name: '',
    address: '',
    city_state: '',
    phone: '',
    youtube: '',
    email: '',
  },
  colors: {
    light_pink: [255, 200, 200],
  },
  logo_path: '',
};

const companyOptions = [
  { label: 'MHD Tech', value: 'mhd-tech' },
  { label: 'Enoylity Studio', value: 'enoylity-studio' },
  { label: 'Enoylity Media Creations LLC', value: 'enoylity-media' },
];

export default function InvoiceSettingsPage() {
  const [selectedCompany, setSelectedCompany] = useState<string>('mhd-tech');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const getSettingsUrl = () => {
    if (selectedCompany === 'mhd-tech') return 'http://127.0.0.1:5000/invoice/settings';
    if (selectedCompany === 'enoylity-studio') return 'http://127.0.0.1:5000/invoiceEnoylity/settings';
    if (selectedCompany === 'enoylity-media') return 'http://127.0.0.1:5000/enoylity/settings';
    return '';
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(getSettingsUrl());

        let data = res.data.data;
        let normalized: Settings;

        if (selectedCompany === 'mhd-tech') {
          normalized = data; // already matches our format
          setLogoPreview(`/static/${data.logo_path}`);
        } else if (selectedCompany === 'enoylity-studio') {
          normalized = {
            company_info: {
              name: data.company_details.company_name,
              address: data.company_details.company_address,
              city_state: '',
              email: data.company_details.company_email,
              phone: data.company_details.company_phone,
              youtube: data.company_details.website,
            },
            colors: {
              light_pink: [255, 200, 200], // placeholder
            },
            logo_path: data.assets.logo_url,
          };
          setLogoPreview(data.assets.logo_url);
        } else if (selectedCompany === 'enoylity-media') {
          normalized = {
            company_info: {
              name: data.company_details.company_name,
              address: data.company_details.company_address,
              city_state: '',
              email: data.company_details.company_email,
              phone: data.company_details.company_phone,
              youtube: data.company_details.website,
            },
            colors: {
              light_pink: [255, 200, 200], // placeholder
            },
            logo_path: data.assets.logo_url,
          };
          setLogoPreview(data.assets.logo_url);
        }

        setSettings(normalized);
      } catch (err) {
        Swal.fire('Error', 'Failed to load settings', 'error');
      }
    };

    fetchSettings();
  }, [selectedCompany]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      company_info: {
        ...prev.company_info,
        [name]: value,
      },
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`http://127.0.0.1:5000/invoiceEnoylity/upload-logo/${selectedCompany}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings((prev) => ({ ...prev, logo_path: res.data.logo_url }));
      setLogoPreview(`/static/${res.data.logo_url}`);
      Swal.fire('Success', 'Logo uploaded', 'success');
    } catch {
      Swal.fire('Error', 'Logo upload failed', 'error');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(getSettingsUrl(), settings);
      Swal.fire('Success', 'Settings updated successfully', 'success');
    } catch {
      Swal.fire('Error', 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-semibold mb-2">{companyOptions.find(opt => opt.value === selectedCompany)?.label} Invoice Settings</h2>

          <div>
            <Label htmlFor="company">Select Company</Label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              {companyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {[
            { label: 'Company Name', name: 'name' },
            { label: 'Address', name: 'address' },
            { label: 'City, State', name: 'city_state' },
            { label: 'Email', name: 'email' },
            { label: 'Phone', name: 'phone' },
            { label: 'YouTube', name: 'youtube' },
          ].map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={settings.company_info[field.name as keyof CompanyInfo]}
                onChange={handleCompanyChange}
                className="mt-1"
              />
            </div>
          ))}

          {/* Uncomment to enable logo upload */}
          {/* <div>
            <Label htmlFor="logo">Company Logo</Label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="mt-4 max-h-24 object-contain" />
            )}
          </div> */}

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

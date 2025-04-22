"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Swal from 'sweetalert2';  // import SweetAlert2

type CompanySettings = {
  company_name: string;
  company_tagline: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  website: string;
  logo_url: string;
};

const companies = [
  { id: 'mhd-tech', name: 'MHD Tech' },
  { id: 'enoylity-media', name: 'Enoylity Media Creations LLC' },
  { id: 'enoylity-studio', name: 'Enoylity Studio' }
];

const defaultSettings: CompanySettings = {
  company_name: '',
  company_tagline: '',
  company_address: '',
  company_email: '',
  company_phone: '',
  website: '',
  logo_url: '',
};

export default function InvoiceSettingsPage() {
  const [selectedCompany, setSelectedCompany] = useState(companies[0].id);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    axios
      .get(`/invoiceEnoylity/settings/${selectedCompany}`)
      .then((res) => {
        setSettings(res.data);
        setLogoPreview(res.data.logo_url);
      })
      .catch(() => Swal.fire('Error', 'Failed to load settings', 'error'));
  }, [selectedCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`/invoiceEnoylity/upload-logo/${selectedCompany}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings((prev) => ({ ...prev, logo_url: res.data.logo_url }));
      setLogoPreview(res.data.logo_url);
      Swal.fire('Success', 'Logo uploaded', 'success');
    } catch {
      Swal.fire('Error', 'Logo upload failed', 'error');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`/invoiceEnoylity/settings/${selectedCompany}`, settings);
      Swal.fire('Success', 'Settings updated successfully', 'success');
    } catch (err) {
      Swal.fire('Error', 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-semibold mb-2">Invoice Company Settings</h2>

          {/* Company Selector */}
          <div>
            <Label htmlFor="company">Select Company</Label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Fields */}
          {[
            { label: 'Company Name', name: 'company_name' },
            { label: 'Tagline', name: 'company_tagline' },
            { label: 'Address', name: 'company_address', textarea: true },
            { label: 'Email', name: 'company_email' },
            { label: 'Phone', name: 'company_phone' },
            { label: 'Website', name: 'website' },
          ].map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.textarea ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={settings[field.name as keyof CompanySettings]}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                  rows={3}
                />
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  value={settings[field.name as keyof CompanySettings]}
                  onChange={handleChange}
                  className="mt-1"
                />
              )}
            </div>
          ))}

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="mt-4 max-h-24 object-contain" />
            )}
          </div>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

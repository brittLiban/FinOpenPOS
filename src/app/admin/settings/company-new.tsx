"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BuildingIcon, PercentIcon, SaveIcon, InfoIcon } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  platform_fee_percent: number;
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
}

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    fetchCompanyData();
    fetchRevenueData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/admin/platform-fee');
      const data = await response.json();
      
      if (data.company || data.platformFeePercent) {
        const platformFeeValue = data.platformFeePercent || data.company?.platform_fee_percent || 2.5;
        setPlatformFee(platformFeeValue.toString());
        setCompanyName(data.company?.name || 'My Business');
        setCompany(data.company);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch('/api/admin/revenue/total');
      const data = await response.json();
      setTotalRevenue(data.totalRevenue || 0);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/platform-fee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformFeePercent: parseFloat(platformFee)
        }),
      });

      if (response.ok) {
        alert('Business settings updated successfully!');
        fetchCompanyData(); // Refresh data
      } else {
        alert('Failed to update business settings');
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
      alert('Error updating business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center space-x-2">
          <BuildingIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Business Settings</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading your business settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center space-x-2">
        <BuildingIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Business Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PercentIcon className="h-5 w-5" />
              <span>Your Fee Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformFee">Processing Fee Rate (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="platformFee"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  placeholder="2.5"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  This is the percentage fee charged on each transaction processed through your POS system. 
                  Standard processing rate is 2.5%.
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Update Fee Structure
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Setup Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Setup Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Stripe Account</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${company?.stripe_account_id ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {company?.stripe_account_id ? 'Connected' : 'Setup Required'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Accept Payments</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${company?.stripe_onboarding_complete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {company?.stripe_onboarding_complete ? 'Ready' : 'Pending Setup'}
                </span>
              </div>

              {company?.stripe_account_id && company?.stripe_onboarding_complete && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Your business is ready to accept payments!
                  </p>
                </div>
              )}

              {(!company?.stripe_account_id || !company?.stripe_onboarding_complete) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    ⚠️ Complete your payment setup to start processing transactions.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Impact on Your Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{platformFee}%</div>
              <div className="text-sm text-muted-foreground">Your Processing Rate</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                ${totalRevenue > 0 ? ((parseFloat(platformFee) / 100) * totalRevenue).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Processing Fees Paid</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                ${totalRevenue > 0 ? (totalRevenue - ((parseFloat(platformFee) / 100) * totalRevenue)).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Your Net Revenue</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>How it works:</strong> Processing fees are automatically deducted from each transaction. 
              Your net revenue is the amount deposited to your bank account after fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

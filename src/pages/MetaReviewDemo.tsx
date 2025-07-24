import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  BarChart3, 
  MousePointer, 
  DollarSign, 
  Eye, 
  Users, 
  TrendingUp,
  Pause,
  Play,
  Building2,
  FileText
} from 'lucide-react'

// Mock data para demonstração
const mockAdAccounts = [
  { id: 'act_123456789', name: 'Test Business Account', currency: 'USD' },
  { id: 'act_987654321', name: 'Demo Agency Account', currency: 'BRL' }
]

const mockPages = [
  { id: 'page_001', name: 'Adsmart Official Page', followers: 15420 },
  { id: 'page_002', name: 'Adsmart Support', followers: 8930 }
]

const mockCampaigns = [
  {
    id: 'camp_001',
    name: 'Summer Sale Campaign',
    status: 'active',
    budget: 100.00,
    spend: 75.00,
    impressions: 125000,
    clicks: 3200,
    ctr: 2.56
  },
  {
    id: 'camp_002',
    name: 'Brand Awareness Campaign',
    status: 'paused',
    budget: 50.00,
    spend: 25.00,
    impressions: 85000,
    clicks: 1200,
    ctr: 1.41
  }
]

const mockPageEngagement = {
  likes: 14890,
  comments: 3420,
  shares: 890,
  reactions: 12500,
  weeklyGrowth: 12.5
}

export function MetaReviewDemo() {
  const [selectedAccount, setSelectedAccount] = useState(mockAdAccounts[0])
  const [selectedPage, setSelectedPage] = useState(mockPages[0])
  const [campaigns, setCampaigns] = useState(mockCampaigns)

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(prev => 
      prev.map(camp => 
        camp.id === campaignId 
          ? { ...camp, status: camp.status === 'active' ? 'paused' : 'active' }
          : camp
      )
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h1 className="text-2xl font-bold mb-2">Meta API Review Demo</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This page demonstrates all requested Meta API permissions in action
            </p>
          </div>

          {/* Permission 1: pages_show_list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Permission: pages_show_list
              </CardTitle>
              <CardDescription>
                Select a Facebook Page from your managed pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedPage.id}
                onChange={(e) => {
                  const page = mockPages.find(p => p.id === e.target.value)
                  if (page) setSelectedPage(page)
                }}
              >
                {mockPages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.name} ({page.followers.toLocaleString()} followers)
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Permission 2 & 3: business_management & ads_read */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-500" />
                Permissions: business_management & ads_read
              </CardTitle>
              <CardDescription>
                Select an Ad Account and view campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedAccount.id}
                onChange={(e) => {
                  const account = mockAdAccounts.find(a => a.id === e.target.value)
                  if (account) setSelectedAccount(account)
                }}
              >
                {mockAdAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>

              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-medium">${campaign.budget}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Spend</p>
                        <p className="font-medium">${campaign.spend}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Impressions</p>
                        <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Clicks</p>
                        <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission 4: read_insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Permission: read_insights
              </CardTitle>
              <CardDescription>
                Performance metrics from the selected Ad Account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <p className="text-sm text-gray-500">Total Impressions</p>
                  </div>
                  <p className="text-2xl font-bold">210,000</p>
                  <p className="text-xs text-green-600">+15% from last period</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-gray-500">Total Clicks</p>
                  </div>
                  <p className="text-2xl font-bold">4,400</p>
                  <p className="text-xs text-green-600">+8% from last period</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-yellow-500" />
                    <p className="text-sm text-gray-500">Total Spend</p>
                  </div>
                  <p className="text-2xl font-bold">$100.00</p>
                  <p className="text-xs text-gray-500">50% of budget</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <p className="text-sm text-gray-500">Avg. CTR</p>
                  </div>
                  <p className="text-2xl font-bold">2.10%</p>
                  <p className="text-xs text-green-600">Above industry avg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permission 5: pages_read_engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Permission: pages_read_engagement
              </CardTitle>
              <CardDescription>
                Organic engagement metrics for {selectedPage.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{mockPageEngagement.likes.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Page Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{mockPageEngagement.comments.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{mockPageEngagement.shares.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Shares</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{mockPageEngagement.reactions.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Reactions</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Weekly engagement growth: +{mockPageEngagement.weeklyGrowth}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Permission 6: ads_management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-red-500" />
                Permission: ads_management
              </CardTitle>
              <CardDescription>
                Toggle campaign status (pause/resume)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-500">
                        Status: <span className={campaign.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                          {campaign.status}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => toggleCampaignStatus(campaign.id)}
                      variant={campaign.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {campaign.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ℹ️ This demonstrates our limited use of ads_management - only for user-initiated status changes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle>✅ All Permissions Demonstrated</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ <strong>pages_show_list:</strong> Dropdown showing Facebook Pages</li>
                <li>✓ <strong>business_management:</strong> Dropdown showing Ad Accounts</li>
                <li>✓ <strong>ads_read:</strong> List of campaigns with metrics</li>
                <li>✓ <strong>read_insights:</strong> Performance dashboard with impressions, clicks, spend</li>
                <li>✓ <strong>pages_read_engagement:</strong> Organic page engagement metrics</li>
                <li>✓ <strong>ads_management:</strong> Campaign pause/resume toggle buttons</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
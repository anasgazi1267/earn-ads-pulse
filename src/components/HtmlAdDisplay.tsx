import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dbService } from '@/services/database';

interface HtmlAdDisplayProps {
  position: 'banner' | 'popup' | 'footer' | 'sidebar';
  className?: string;
}

const HtmlAdDisplay: React.FC<HtmlAdDisplayProps> = ({ position, className = '' }) => {
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHtmlAd();
  }, [position]);

  const loadHtmlAd = async () => {
    try {
      setLoading(true);
      const settings = await dbService.getAdminSettings();
      const adCode = settings[`${position}_ad_code`] || '';
      setHtmlCode(adCode);
    } catch (error) {
      console.error('Error loading HTML ad:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse bg-gray-700 h-24 rounded"></div>
      </div>
    );
  }

  if (!htmlCode.trim()) {
    return null;
  }

  return (
    <div className={`html-ad-container ${className}`}>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 text-xs">
              Ad - {position.charAt(0).toUpperCase() + position.slice(1)}
            </Badge>
          </div>
          <div 
            className="html-ad-content"
            dangerouslySetInnerHTML={{ __html: htmlCode }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HtmlAdDisplay;
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Send, Percent, Calendar, Tag } from 'lucide-react';

interface Customer {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function PromotionModal({ isOpen, onClose, customer }: PromotionModalProps) {
  const [promotionType, setPromotionType] = useState('discount');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendPromotion = async () => {
    if (!customer || !subject || !message) return;

    try {
      setSending(true);
      
      // Create promotion message
      const promotionMessage = {
        recipientId: customer._id,
        recipientName: customer.customerName,
        recipientRole: 'customer',
        content: `🎉 SPECIAL OFFER FOR ${customer.customerName.toUpperCase()}! 🎉

${subject}

${message}

${promotionType === 'discount' ? `💰 ${discountType === 'percentage' ? discountValue + '%' : '$' + discountValue} ${discountType === 'percentage' ? 'DISCOUNT' : 'OFF'} AVAILABLE!` : ''}

${validUntil ? `⏰ Valid until: ${validUntil}` : ''}

Book now to take advantage of this exclusive offer!

Best regards,
Hotel Management Team`,
        messageType: 'text' // Use valid message type
      };

      console.log('Sending promotion message:', promotionMessage);

      const response = await fetch('/api/hotel/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionMessage),
      });

      console.log('Promotion response status:', response.status);

      if (response.ok) {
        // Reset form
        setSubject('');
        setMessage('');
        setDiscountValue('');
        setValidUntil('');
        onClose();
      } else {
        const error = await response.json();
        console.error('Failed to send promotion:', error);
      }
    } catch (error) {
      console.error('Error sending promotion:', error);
    } finally {
      setSending(false);
    }
  };

  const generateDefaultSubject = () => {
    if (promotionType === 'discount') {
      return `Special ${discountValue}${discountType === 'percentage' ? '%' : '$'} ${discountType === 'percentage' ? 'Discount' : 'Off'} for Your Next Stay!`;
    }
    return 'Special Offer for Valued Customer!';
  };

  const generateDefaultMessage = () => {
    return `Dear ${customer?.customerName},

We hope you enjoyed your recent stay with us! As a valued customer, we'd like to offer you a special deal for your next visit.

${promotionType === 'discount' ? `We're offering you ${discountValue}${discountType === 'percentage' ? '%' : '$'} ${discountType === 'percentage' ? 'off' : 'off'} your next booking!` : 'We have a special offer just for you!'}

${validUntil ? `This offer is valid until ${validUntil}.` : ''}

We look forward to welcoming you back soon!

Best regards,
Hotel Management Team`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Send Promotion to {customer?.customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Promotion Type */}
          <div>
            <Label htmlFor="promotionType">Promotion Type</Label>
            <Select value={promotionType} onValueChange={setPromotionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select promotion type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Discount Offer</SelectItem>
                <SelectItem value="package">Special Package</SelectItem>
                <SelectItem value="loyalty">Loyalty Reward</SelectItem>
                <SelectItem value="seasonal">Seasonal Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Details */}
          {promotionType === 'discount' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">Discount Value</Label>
                <div className="relative">
                  {discountType === 'percentage' ? (
                    <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                  )}
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={discountType === 'percentage' ? '10' : '50'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className={discountType === 'percentage' ? 'pl-10' : 'pl-8'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Valid Until */}
          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter promotion subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter promotion message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

          {/* Quick Templates */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubject(generateDefaultSubject());
                setMessage(generateDefaultMessage());
              }}
            >
              <Tag className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSendPromotion}
              disabled={!subject || !message || sending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Promotion'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

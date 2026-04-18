import { useState, useCallback, useEffect } from 'react';
import { Quotation, QuotationItem, QuotationStatus, DiscountType } from '../types/quotation';
import { quotationsService } from '../services/quotationsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useQuoteBuilder(id?: string) {
  const { tenant, user } = useAuth();
  const [quotation, setQuotation] = useState<Partial<Quotation>>({
    title: '',
    status: 'draft',
    pax_adults: 1,
    pax_children: 0,
    pax_infants: 0,
    gst_rate: 5.00,
    discount_type: 'none' as DiscountType,
    discount_value: 0,
    version: 1,
    subtotal: 0,
    total_amount: 0,
    total_margin: 0,
    margin_percentage: 0
  });
  const [items, setItems] = useState<Partial<QuotationItem>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Client-side recalculation
  const recalculateClientSide = useCallback(() => {
    let subtotal = 0;
    let costPrice = 0;

    items.forEach(item => {
      if (item.is_included) {
        subtotal += (item.quantity || 1) * (item.selling_price || 0);
        costPrice += (item.quantity || 1) * (item.cost_price || 0);
      }
    });

    let discountAmount = 0;
    if (quotation.discount_type === 'percentage') {
      discountAmount = subtotal * ((quotation.discount_value || 0) / 100);
    } else if (quotation.discount_type === 'flat') {
      discountAmount = quotation.discount_value || 0;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = taxableAmount * ((quotation.gst_rate || 5) / 100);
    const totalAmount = taxableAmount + gstAmount;
    const totalMargin = totalAmount - costPrice;
    const marginPercentage = totalAmount > 0 ? (totalMargin / totalAmount) * 100 : 0;

    setQuotation(prev => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      taxable_amount: taxableAmount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      selling_price: totalAmount,
      cost_price: costPrice,
      total_vendor_cost: costPrice,
      total_margin: totalMargin,
      margin_percentage: marginPercentage
    }));
  }, [items, quotation.discount_type, quotation.discount_value, quotation.gst_rate]);

  useEffect(() => {
    recalculateClientSide();
  }, [items, quotation.discount_type, quotation.discount_value, quotation.gst_rate, recalculateClientSide]);

  const load = useCallback(async (quoteId: string) => {
    setIsLoading(true);
    try {
      const data = await quotationsService.getQuotationById(quoteId);
      const { items: loadedItems, ...q } = data;
      setQuotation(q);
      setItems(loadedItems || []);
      setIsDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = async () => {
    if (!tenant?.id) return;
    setIsSaving(true);
    try {
      let savedId = quotation.id;
      if (quotation.id) {
        // Update existing
        await quotationsService.updateQuotation(quotation.id, quotation);
        await quotationsService.updateQuotationItems(quotation.id, tenant.id, items);
      } else {
        // Create new
        const newQuote = await quotationsService.createQuotation(
          { ...quotation, tenant_id: tenant.id, created_by: user?.id },
          items
        );
        savedId = newQuote.id;
      }
      setIsDirty(false);
      return savedId;
    } catch (e) {
       console.error(e);
       throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (category: any = 'misc') => {
    const newItem: Partial<QuotationItem> = {
      category,
      description: '',
      quantity: 1,
      unit: 'flat',
      unit_price: 0,
      selling_price: 0,
      cost_price: 0,
      is_included: true,
      is_optional: false,
      sort_order: items.length
    };
    setItems([...items, newItem]);
    setIsDirty(true);
  };

  const updateItem = (index: number, updates: Partial<QuotationItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    
    // Auto sync unit price and selling price if unit price is changed
    if (updates.unit_price !== undefined) {
      newItems[index].selling_price = updates.unit_price;
    }

    setItems(newItems);
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const reorderItems = (newOrder: Partial<QuotationItem>[]) => {
    setItems(newOrder);
    setIsDirty(true);
  };

  return {
    quotation,
    setQuotation,
    items,
    isLoading,
    isSaving,
    isDirty,
    load,
    save,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    setIsDirty
  };
}

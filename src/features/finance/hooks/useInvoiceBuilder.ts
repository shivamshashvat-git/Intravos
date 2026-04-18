import { useState, useCallback, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMode } from '../types/invoice';
import { invoicesService } from '../services/invoicesService';
import { useAuth } from '@/core/hooks/useAuth';
import { DiscountType, ItemCategory } from '../types/quotation';

export function useInvoiceBuilder(id?: string) {
  const { tenant, user } = useAuth();
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    title: '',
    status: 'draft',
    pax_adults: 1,
    pax_children: 0,
    pax_infants: 0,
    gst_rate: 5.00,
    discount_type: 'none' as DiscountType,
    discount_value: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    is_igst: false,
    subtotal: 0,
    total_amount: 0,
    amount_paid: 0,
    amount_outstanding: 0
  });
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const recalculateClientSide = useCallback(() => {
    let subtotal = 0;
    let costPrice = 0;

    items.forEach(item => {
      subtotal += (item.quantity || 1) * (item.selling_price || 0);
      costPrice += (item.quantity || 1) * (item.cost_price || 0);
    });

    let discountAmount = 0;
    if (invoice.discount_type === 'percentage') discountAmount = subtotal * ((invoice.discount_value || 0) / 100);
    else if (invoice.discount_type === 'flat') discountAmount = invoice.discount_value || 0;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    let cgst_rate = 0, sgst_rate = 0, igst_rate = 0;
    let cgst_amount = 0, sgst_amount = 0, igst_amount = 0;

    if (invoice.is_igst) {
      igst_rate = invoice.gst_rate || 5;
      igst_amount = taxableAmount * (igst_rate / 100);
    } else {
      cgst_rate = (invoice.gst_rate || 5) / 2;
      sgst_rate = (invoice.gst_rate || 5) / 2;
      cgst_amount = taxableAmount * (cgst_rate / 100);
      sgst_amount = taxableAmount * (sgst_rate / 100);
    }

    const gstAmount = cgst_amount + sgst_amount + igst_amount;
    const totalAmount = taxableAmount + gstAmount;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      taxable_amount: taxableAmount,
      gst_amount: gstAmount,
      cgst_rate, sgst_rate, igst_rate,
      cgst_amount, sgst_amount, igst_amount,
      total_amount: totalAmount,
      selling_price: totalAmount,
      cost_price: costPrice,
      total_vendor_cost: costPrice,
      total_margin: totalAmount - costPrice,
      margin_percentage: totalAmount > 0 ? ((totalAmount - costPrice) / totalAmount) * 100 : 0,
      amount_outstanding: totalAmount - (prev.amount_paid || 0)
    }));
  }, [items, invoice.discount_type, invoice.discount_value, invoice.gst_rate, invoice.is_igst]);

  useEffect(() => {
    recalculateClientSide();
  }, [items, invoice.discount_type, invoice.discount_value, invoice.gst_rate, invoice.is_igst, recalculateClientSide]);

  const load = useCallback(async (invoiceId: string) => {
    setIsLoading(true);
    try {
      const data = await invoicesService.getInvoiceById(invoiceId);
      const { items: loadedItems, ...q } = data;
      setInvoice(q);
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
      let savedId = invoice.id;
      if (invoice.id) {
        await (invoicesService as any).updateInvoice(invoice.id, invoice);
        await (invoicesService as any).updateInvoiceStatus(invoice.id, invoice.status);
      } else {
        const newInv = await invoicesService.createInvoice(
          { ...invoice, tenant_id: tenant.id, created_by: user?.id },
          items
        );
        savedId = newInv.id;
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
    const newItem: Partial<InvoiceItem> = {
      category,
      description: '',
      quantity: 1,
      unit: 'flat',
      unit_price: 0,
      selling_price: 0,
      cost_price: 0,
      sort_order: items.length
    };
    setItems([...items, newItem]);
    setIsDirty(true);
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    if (updates.unit_price !== undefined) newItems[index].selling_price = updates.unit_price;
    setItems(newItems);
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  return {
    invoice, setInvoice, items, isLoading, setIsLoading, isSaving, isDirty,
    load, save, addItem, updateItem, removeItem, setIsDirty
  };
}

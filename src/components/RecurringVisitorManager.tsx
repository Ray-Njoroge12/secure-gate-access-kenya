import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Repeat, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface RecurringVisitor {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  visit_purpose: string;
  recurrence_rule: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[];
  days_of_month?: number[];
}

export const RecurringVisitorManager: React.FC = () => {
  const [recurringVisitors, setRecurringVisitors] = useState<RecurringVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    visit_purpose: '',
    recurrence_rule: 'weekly',
    interval: 1,
    days_of_week: [] as number[],
    start_date: '',
    end_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRecurringVisitors();
  }, []);

  const loadRecurringVisitors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pre_approved_visitors')
        .select('*')
        .eq('resident_id', user.id)
        .eq('is_recurring', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurringVisitors(data || []);
    } catch (error) {
      toast({
        title: "Error loading visitors",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleAddRecurringVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const recurrenceRule = buildRecurrenceRule();
      
      const { error } = await supabase
        .from('pre_approved_visitors')
        .insert({
          resident_id: user.id,
          visitor_name: newVisitor.visitor_name,
          visitor_email: newVisitor.visitor_email,
          visitor_phone: newVisitor.visitor_phone,
          visit_purpose: newVisitor.visit_purpose,
          recurrence_rule: recurrenceRule,
          start_date: newVisitor.start_date,
          end_date: newVisitor.end_date,
          is_recurring: true,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring visitor added successfully",
      });

      setNewVisitor({
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        visit_purpose: '',
        recurrence_rule: 'weekly',
        interval: 1,
        days_of_week: [],
        start_date: '',
        end_date: '',
      });
      setShowAddForm(false);
      loadRecurringVisitors();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildRecurrenceRule = (): string => {
    const rule: RecurrenceRule = {
      frequency: newVisitor.recurrence_rule as 'daily' | 'weekly' | 'monthly',
      interval: newVisitor.interval,
    };

    if (newVisitor.recurrence_rule === 'weekly' && newVisitor.days_of_week.length > 0) {
      rule.days_of_week = newVisitor.days_of_week;
    }

    return JSON.stringify(rule);
  };

  const toggleVisitorStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('pre_approved_visitors')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadRecurringVisitors();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const deleteRecurringVisitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pre_approved_visitors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecurringVisitors();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const formatRecurrenceRule = (rule: string) => {
    try {
      const parsed: RecurrenceRule = JSON.parse(rule);
      const frequency = parsed.frequency;
      const interval = parsed.interval;
      
      let description = `Every ${interval} ${frequency}`;
      if (parsed.days_of_week && parsed.days_of_week.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames = parsed.days_of_week.map(d => days[d]);
        description += ` on ${dayNames.join(', ')}`;
      }
      
      return description;
    } catch {
      return rule;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recurring Visitors</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring Visitor
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Recurring Visitor</CardTitle>
            <CardDescription>
              Set up automatic invitations for frequent visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRecurringVisitor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visitor Name</Label>
                  <Input
                    value={newVisitor.visitor_name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visitor_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newVisitor.visitor_email}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visitor_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newVisitor.visitor_phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visitor_phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visit Purpose</Label>
                  <Input
                    value={newVisitor.visit_purpose}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visit_purpose: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newVisitor.recurrence_rule}
                    onValueChange={(value) => setNewVisitor({ ...newVisitor, recurrence_rule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newVisitor.interval}
                    onChange={(e) => setNewVisitor({ ...newVisitor, interval: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Days (if weekly)</Label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <label key={day} className="flex items-center">
                        <Checkbox
                          checked={newVisitor.days_of_week.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewVisitor({
                                ...newVisitor,
                                days_of_week: [...newVisitor.days_of_week, day]
                              });
                            } else {
                              setNewVisitor({
                                ...newVisitor,
                                days_of_week: newVisitor.days_of_week.filter(d => d !== day)
                              });
                            }
                          }}
                        />
                        <span className="ml-1 text-sm">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newVisitor.start_date}
                    onChange={(e) => setNewVisitor({ ...newVisitor, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newVisitor.end_date}
                    onChange={(e) => setNewVisitor({ ...newVisitor, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Recurring Visitor"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {recurringVisitors.map((visitor) => (
          <Card key={visitor.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{visitor.visitor_name}</h3>
                  <p className="text-sm text-muted-foreground">{visitor.visitor_email}</p>
                  <p className="text-sm text-muted-foreground">{visitor.visit_purpose}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRecurrenceRule(visitor.recurrence_rule)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(visitor.start_date), 'MMM d, yyyy')} - 
                    {format(new Date(visitor.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={visitor.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleVisitorStatus(visitor.id, visitor.is_active)}
                >
                  {visitor.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRecurringVisitor(visitor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recurringVisitors.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Repeat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring visitors</h3>
            <p className="text-muted-foreground">
              Add recurring visitors to automatically send invitations on a schedule
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

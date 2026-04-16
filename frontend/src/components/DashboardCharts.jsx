import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Calendar, Clock, MoreHorizontal, PieChart } from 'lucide-react';

const DashboardCharts = ({ summary, role }) => {
  const navigate = useNavigate();
  
  // Default values if summary is not yet loaded
  const counts = summary || {
    total_employees: 0,
    active_shifts: 0,
    today_leaves: 0,
    shift_assignments: { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
  };

  const employeesOverviewOptions = {
    chart: { type: 'column', height: 280, style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: '' },
    xAxis: { categories: ['Support', 'Sales', 'Tech', 'Total'], lineColor: '#f0f0f0', tickLength: 0 },
    yAxis: { min: 0, title: { text: null }, gridLineColor: '#f0f0f0', gridLineDashStyle: 'Solid' },
    plotOptions: {
      column: {
        borderRadius: 4,
        colorByPoint: true,
        colors: ['#3b82f6', '#93c5fd', '#2dd4bf', '#60a5fa'],
        dataLabels: { enabled: true, color: '#333', style: { textOutline: 'none', fontWeight: 'bold' } }
      }
    },
    legend: { enabled: true, itemStyle: { fontWeight: 'normal', color: '#666' } },
    series: [{
      name: 'Employees',
      data: [400, 200, 400, 1000],
      showInLegend: false
    }],
    credits: { enabled: false }
  };

  const shiftsOverviewOptions = {
    chart: { type: 'column', height: 280, style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: '' },
    xAxis: { categories: Object.keys(counts.shift_assignments), lineColor: '#f0f0f0', tickLength: 0 },
    yAxis: { min: 0, title: { text: null }, gridLineColor: '#f0f0f0' },
    plotOptions: {
      column: {
        borderRadius: 4,
        colorByPoint: true,
        colors: ['#f59e0b', '#fde047', '#3b82f6', '#8b5cf6'],
        dataLabels: { enabled: true, color: '#333', style: { textOutline: 'none', fontWeight: 'bold' } }
      }
    },
    legend: { enabled: false },
    series: [{
      name: 'Assignments',
      data: Object.values(counts.shift_assignments)
    }],
    credits: { enabled: false }
  };

  const employeesBottomOptions = {
    chart: { type: 'column', height: 200, style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: '' },
    xAxis: { categories: Object.keys(counts.shift_assignments), lineColor: '#f0f0f0', tickLength: 0 },
    yAxis: { min: 0, title: { text: null }, gridLineColor: '#f0f0f0' },
    plotOptions: {
      column: {
        borderRadius: 4,
        colorByPoint: true,
        colors: ['#2563eb', '#7dd3fc', '#2dd4bf', '#3b82f6', '#8b5cf6'],
        dataLabels: { enabled: true, color: '#333', style: { textOutline: 'none', fontWeight: 'bold' }, y: -5 }
      }
    },
    legend: { enabled: false },
    series: [{
      name: 'Assigned',
      data: Object.values(counts.shift_assignments)
    }],
    credits: { enabled: false }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
      
      {/* Top Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Total Employees */}
        <div 
          onClick={() => navigate(`/${role.toLowerCase()}/employees`)}
          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{counts.total_employees}</span>
            <Users size={20} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>Total Employees</span>
        </div>

        {/* Active Shifts */}
        <div 
          onClick={() => navigate(`/${role.toLowerCase()}/shifts`)}
          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{counts.active_shifts}</span>
            <Calendar size={20} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>Active Shifts</span>
        </div>

        {/* Today's Leaves */}
        <div 
          onClick={() => navigate(`/${role.toLowerCase()}/leaves`)}
          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{counts.today_leaves}</span>
            <Clock size={20} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>Today's Leaves</span>
        </div>

        {/* AI Status */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1, background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>ONLINE</span>
            <PieChart size={20} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>AI Engine Status</span>
        </div>

      </div>

      {/* Middle Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Employees Overview */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Employees Overview</h3>
            <MoreHorizontal size={20} color="#94a3b8" />
          </div>
          <HighchartsReact highcharts={Highcharts} options={employeesOverviewOptions} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', marginTop: '-10px', color: '#64748b', fontWeight: 500 }}>
             <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#3b82f6', fontSize: '16px'}}>■</span> Support</span>
             <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#93c5fd', fontSize: '16px'}}>■</span> Sales</span>
             <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#60a5fa', fontSize: '16px'}}>■</span> Total</span>
          </div>
        </div>

        {/* Shifts Overview */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Shifts Overview</h3>
            <MoreHorizontal size={20} color="#94a3b8" />
          </div>
          <HighchartsReact highcharts={Highcharts} options={shiftsOverviewOptions} />
        </div>

      </div>

      {/* Bottom Chart */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Employees</h3>
            <MoreHorizontal size={20} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                 <HighchartsReact highcharts={Highcharts} options={employeesBottomOptions} />
              </div>
              <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  {Object.keys(counts.shift_assignments).map((name, i) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                          <span style={{color: ['#f59e0b', '#fcd34d', '#3b82f6', '#8b5cf6'][i % 4], fontSize: '16px'}}>■</span> {name}
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
};

export default DashboardCharts;

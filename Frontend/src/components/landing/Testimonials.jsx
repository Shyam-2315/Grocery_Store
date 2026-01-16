import React from 'react';
import { Box, Container, Grid, Typography, Avatar, Card, CardContent } from '@mui/material';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Owner, Fresh Mart",
    content: "The offline mode saved us during a power outage. We kept selling while other stores had to close!",
    avatar: "S"
  },
  {
    name: "Raj Patel",
    role: "Manager, City Grocers",
    content: "Inventory tracking used to take hours. Now it's automatic. Highly recommended for small businesses.",
    avatar: "R"
  },
  {
    name: "Mike Thompson",
    role: "Franchise Owner",
    content: "The best investment we made this year. The interface is so simple my new staff learned it in 10 minutes.",
    avatar: "M"
  }
];

const Testimonials = () => {
  return (
    <Box sx={{ py: 10, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" fontWeight={700} gutterBottom>
          Trusted by Retailers
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {testimonials.map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', mb: 3 }}>
                    "{item.content}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{item.avatar}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials;
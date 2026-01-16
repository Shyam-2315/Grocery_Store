import React from 'react';
import { Box, Button, Card, CardActions, CardContent, CardHeader, Container, Grid, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/StarBorder';

const tiers = [
  {
    title: 'Basic',
    price: '29',
    description: ['1 Store Location', 'Basic Inventory', '5 Staff Accounts', 'Email Support'],
    buttonText: 'Sign up for free',
    buttonVariant: 'outlined',
  },
  {
    title: 'Professional',
    subheader: 'Most Popular',
    price: '79',
    description: ['3 Store Locations', 'Advanced Analytics', 'Unlimited Staff', 'Priority Support'],
    buttonText: 'Get started',
    buttonVariant: 'contained',
  },
  {
    title: 'Enterprise',
    price: '199',
    description: ['Unlimited Stores', 'Dedicated API Access', 'Custom Integrations', '24/7 Phone Support'],
    buttonText: 'Contact sales',
    buttonVariant: 'outlined',
  },
];

const Pricing = () => {
  return (
    <Container maxWidth="lg" component="main" sx={{ pt: 8, pb: 12 }}>
      <Typography component="h1" variant="h3" align="center" color="text.primary" gutterBottom fontWeight={700}>
        Simple, Transparent Pricing
      </Typography>
      <Typography variant="h5" align="center" color="text.secondary" component="p" sx={{ mb: 8 }}>
        Choose the plan that fits your business size.
      </Typography>
      <Grid container spacing={5} alignItems="flex-end">
        {tiers.map((tier) => (
          <Grid item key={tier.title} xs={12} sm={tier.title === 'Enterprise' ? 12 : 6} md={4}>
            <Card>
              <CardHeader
                title={tier.title}
                subheader={tier.subheader}
                titleTypographyProps={{ align: 'center' }}
                action={tier.title === 'Professional' ? <StarIcon /> : null}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
                }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                  <Typography component="h2" variant="h3" color="text.primary">
                    ${tier.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">/mo</Typography>
                </Box>
                <ul>
                  {tier.description.map((line) => (
                    <Typography component="li" variant="subtitle1" align="center" key={line}>
                      {line}
                    </Typography>
                  ))}
                </ul>
              </CardContent>
              <CardActions>
                <Button fullWidth variant={tier.buttonVariant}>
                  {tier.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Pricing;
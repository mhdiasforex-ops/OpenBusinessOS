import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtGuard, PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @Permissions('products:manage')
  @ApiOperation({ summary: 'Criar produto' })
  async createProduct(@Request() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('products:read')
  @ApiOperation({ summary: 'Listar produtos' })
  async getProducts(@Request() req: any, @Query() filters: any) {
    return this.productsService.getProducts(req.user.organizationId, filters);
  }

  @Get(':id')
  @Permissions('products:read')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  async getProduct(@Request() req: any, @Param('id') id: string) {
    return this.productsService.getProduct(req.user.organizationId, id);
  }

  @Patch(':id')
  @Permissions('products:manage')
  @ApiOperation({ summary: 'Atualizar produto' })
  async updateProduct(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('products:manage')
  @ApiOperation({ summary: 'Remover produto' })
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.user.organizationId, id);
  }

  @Post(':id/adjust-stock')
  @Permissions('products:manage')
  @ApiOperation({ summary: 'Ajustar estoque do produto' })
  async adjustStock(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number; reason: string },
  ) {
    return this.productsService.adjustStock(req.user.organizationId, id, body.quantity, body.reason);
  }
}
